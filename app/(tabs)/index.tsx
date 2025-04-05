import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { API_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface BudgetData {
  totalBudget: number;
  totalIncome: number;
  totalExpenses: number;
}

const CATEGORY_COLORS = {
  'Food & Dining': '#FF9500',
  'Shopping': '#5856D6',
  'Entertainment': '#AF52DE',
  'Transportation': '#007AFF',
  'Housing': '#34C759',
  'Utilities': '#5AC8FA',
  'Healthcare': '#FF2D55',
  'Other': '#8E8E93'
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      // First, fetch ALL transactions for the pie chart and totals
      const allRes = await fetch(`${API_URL}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!allRes.ok) throw new Error('Failed to fetch transactions');
      const allData = await allRes.json();
      setAllTransactions(allData);

      // Then get just the 2 most recent transactions
      const sortedTransactions = [...allData]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2);
      setRecentTransactions(sortedTransactions);

      // Fetch budget data
      const budgetsRes = await fetch(`${API_URL}/budgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!budgetsRes.ok) throw new Error('Failed to fetch budgets');

      // Calculate totals
      const budgets = await budgetsRes.json();
      const totalBudget = budgets.reduce((sum: number, budget: any) => sum + budget.amount, 0);
      const totalIncome = allData
        .filter((t: Transaction) => t.type === 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const totalExpenses = allData
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setBudgetData({
        totalBudget,
        totalIncome,
        totalExpenses
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Calculate remaining balance
  const remaining = budgetData ? Math.max(0, budgetData.totalBudget - budgetData.totalExpenses + budgetData.totalIncome) : 0;
  const totalSpent = budgetData?.totalExpenses || 0;

  // Prepare category chart data from all expenses
  const categoryChartData = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.entries(categoryChartData)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category,
      amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome to FinTrack</Text>
        <Text style={styles.balance}>${remaining.toFixed(2)}</Text>
        <Text style={styles.balanceLabel}>Available Balance</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={styles.chartContainer}>
          {pieChartData.length > 0 ? (
            <>
              <PieChart
                data={pieChartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  strokeWidth: 2,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={false}
              />
              <View style={styles.chartLegend}>
                {pieChartData.map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.name}: ${item.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>No spending data available</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length > 0 ? (
          <View style={styles.transactionList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction._id} style={styles.transaction}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: CATEGORY_COLORS[transaction.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.Other }
                ]}>
                  <Text style={styles.transactionIconText}>
                    {transaction.type === 'expense' ? '↓' : '↑'}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.income : styles.expense
                ]}>
                  {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No recent transactions</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
  },
  balance: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  chartLegend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 16,
    color: '#000000',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#000000',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expense: {
    color: '#FF3B30',
  },
  income: {
    color: '#34C759',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
});