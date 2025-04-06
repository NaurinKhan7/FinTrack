import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { API_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Housing',
  'Utilities',
  'Healthcare',
  'Salary',
  'Other'
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const response = await fetch(`${API_URL}/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');
      
      setTransactions(await response.json());
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const handleAddTransaction = async () => {
    try {
      if (!amount || !description || !category) {
        throw new Error('Please fill all fields');
      }
  
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');
  
      // Debug log
      console.log('Submitting transaction with:', {
        type,
        amount: parseFloat(amount),
        category,
        description
      });
  
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          description: description.trim(),
          category: category.trim(), // Ensure trimmed category
          date: new Date().toISOString()
        }),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        // Enhanced error logging
        console.error('Server responded with error:', {
          status: response.status,
          data: responseData
        });
        throw new Error(responseData.message || `Server error: ${response.status}`);
      }
  
      // Reset form and refresh
      setAmount('');
      setDescription('');
      setCategory('');
      setShowAddForm(false);
      await fetchTransactions();
  
      Alert.alert('Success', 'Transaction added successfully');
    } catch (err: any) {
      console.error('Transaction submission error:', {
        error: err,
        message: err.message,
        stack: err.stack
      });
      Alert.alert('Error', err.message || 'Failed to add transaction');
    }
  };
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {showAddForm && (
          <View style={styles.form}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            
            <TouchableOpacity 
              style={styles.categoryInput}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={category ? styles.categoryText : styles.categoryPlaceholder}>
                {category || 'Select category'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleAddTransaction}
            >
              <Text style={styles.submitButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={categoryModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <ScrollView>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryItem}
                    onPress={() => {
                      setCategory(cat);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={styles.categoryItemText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.transactionList}>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found</Text>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction._id} style={styles.transaction}>
                <View style={[
                  styles.transactionIcon, 
                  transaction.type === 'expense' ? styles.expenseIcon : styles.incomeIcon
                ]}>
                  {transaction.type === 'expense' ? (
                    <ArrowUpRight color="#FF3B30" size={24} />
                  ) : (
                    <ArrowDownLeft color="#34C759" size={24} />
                  )}
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
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  categoryInput: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#000000',
  },
  categoryPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIcon: {
    backgroundColor: '#FFE5E5',
  },
  incomeIcon: {
    backgroundColor: '#E5FFE5',
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
    marginRight: 12,
  },
  expense: {
    color: '#FF3B30',
  },
  income: {
    color: '#34C759',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '60%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryItemText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

