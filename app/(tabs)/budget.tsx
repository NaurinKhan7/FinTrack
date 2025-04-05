// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Plus, Pencil } from 'lucide-react-native';
// import { useState, useCallback } from 'react';
// import { useFocusEffect } from 'expo-router';
// import { API_URL } from '@/config/api';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// interface Budget {
//   _id: string;
//   category: string;
//   amount: number;
//   period: string;
//   user: string;
//   alerts: {
//     enabled: boolean;
//     threshold: number;
//   };
// }

// interface BudgetStatus {
//   budget: number;
//   spent: number;
//   remaining: number;
//   percentage: number;
// }

// const colors = ['#007AFF', '#5856D6', '#FF2D55', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];
// const defaultCategories = ['Food & Dining', 'Shopping', 'Entertainment', 'Transportation', 'Housing', 'Utilities', 'Healthcare'];

// export default function BudgetScreen() {
//   const insets = useSafeAreaInsets();
//   const [budgets, setBudgets] = useState<Array<Budget & { status?: BudgetStatus }>>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [newBudget, setNewBudget] = useState({
//     category: '',
//     amount: '',
//     period: 'monthly'
//   });
//   const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
//   const [totalIncome, setTotalIncome] = useState(0);
//   const [totalExpenses, setTotalExpenses] = useState(0);
//   const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});

//   const fetchData = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError('');
      
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         throw new Error('Authentication token not found');
//       }

//       const headers = {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       };

//       // Fetch transactions
//       const transactionsResponse = await fetch(`${API_URL}/transactions`, { headers });
//       if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
//       const transactions = await transactionsResponse.json();

//       // Calculate transaction summary
//       const income = transactions
//         .filter((t: any) => t.type === 'income')
//         .reduce((sum: number, t: any) => sum + t.amount, 0);
      
//       const expenses = transactions
//         .filter((t: any) => t.type === 'expense')
//         .reduce((sum: number, t: any) => sum + t.amount, 0);

//       const spending: Record<string, number> = {};
//       transactions
//         .filter((t: any) => t.type === 'expense')
//         .forEach((t: any) => {
//           spending[t.category] = (spending[t.category] || 0) + t.amount;
//         });

//       setTotalIncome(income);
//       setTotalExpenses(expenses);
//       setCategorySpending(spending);

//       // Fetch budgets
//       const budgetsResponse = await fetch(`${API_URL}/budgets`, { headers });
//       if (!budgetsResponse.ok) throw new Error('Failed to fetch budgets');
//       const budgetsData = await budgetsResponse.json();

//       // Calculate budget status
//       const budgetsWithStatus = budgetsData.map((budget: Budget) => {
//         const spent = spending[budget.category] || 0;
//         const remaining = budget.amount - spent;
//         const percentage = (spent / budget.amount) * 100;

//         return {
//           ...budget,
//           status: {
//             budget: budget.amount,
//             spent,
//             remaining,
//             percentage
//           }
//         };
//       });

//       setBudgets(budgetsWithStatus);
//     } catch (err: any) {
//       console.error('Error fetching data:', err);
//       setError(err.message || 'Failed to load data');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       fetchData();
//     }, [fetchData])
//   );

//   const createBudget = async () => {
//     try {
//       if (!newBudget.category || !newBudget.amount) {
//         throw new Error('Please fill all fields');
//       }

//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         throw new Error('Authentication token not found');
//       }

//       const headers = {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       };
      
//       const response = await fetch(`${API_URL}/budgets`, {
//         method: 'POST',
//         headers,
//         body: JSON.stringify({
//           category: newBudget.category,
//           amount: Number(newBudget.amount),
//           period: newBudget.period
//         }),
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to create budget');
//       }
      
//       setModalVisible(false);
//       setNewBudget({ category: '', amount: '', period: 'monthly' });
//       await fetchData();
//     } catch (err: any) {
//       console.error('Error creating budget:', err);
//       setError(err.message || 'Failed to create budget');
//     }
//   };

//   const updateBudget = async () => {
//     if (!editingBudget) return;

//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         throw new Error('Authentication token not found');
//       }

//       const headers = {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       };
      
//       const response = await fetch(`${API_URL}/budgets/${editingBudget._id}`, {
//         method: 'PUT',
//         headers,
//         body: JSON.stringify({
//           category: editingBudget.category,
//           amount: editingBudget.amount,
//           period: editingBudget.period
//         }),
//       });
      
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to update budget');
//       }
      
//       setEditModalVisible(false);
//       setEditingBudget(null);
//       await fetchData();
//     } catch (err: any) {
//       console.error('Error updating budget:', err);
//       setError(err.message || 'Failed to update budget');
//     }
//   };

//   const deleteBudget = async (id: string) => {
//     try {
//       Alert.alert(
//         'Delete Budget',
//         'Are you sure you want to delete this budget?',
//         [
//           {
//             text: 'Cancel',
//             style: 'cancel',
//           },
//           {
//             text: 'Delete',
//             onPress: async () => {
//               const token = await AsyncStorage.getItem('userToken');
//               if (!token) {
//                 throw new Error('Authentication token not found');
//               }

//               const headers = {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`,
//               };
              
//               const response = await fetch(`${API_URL}/budgets/${id}`, {
//                 method: 'DELETE',
//                 headers,
//               });
              
//               if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to delete budget');
//               }
              
//               await fetchData();
//             },
//             style: 'destructive',
//           },
//         ],
//         { cancelable: true }
//       );
//     } catch (err: any) {
//       console.error('Error deleting budget:', err);
//       setError(err.message || 'Failed to delete budget');
//     }
//   };

//   const calculateTotals = () => {
//     const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
//     const remaining = totalBudget - totalExpenses + totalIncome;

//     return {
//       totalBudget,
//       remaining,
//       overspent: remaining < 0
//     };
//   };

//   if (loading) {
//     return (
//       <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   const { totalBudget, remaining, overspent } = calculateTotals();

//   return (
//     <ScrollView 
//       style={[styles.container, { paddingTop: insets.top }]}
//       contentContainerStyle={styles.content}
//     >
//       <View style={styles.header}>
//         <Text style={styles.title}>Budget Overview</Text>
//         <TouchableOpacity 
//           style={styles.addButton} 
//           onPress={() => setModalVisible(true)}
//         >
//           <Plus color="#fff" size={24} />
//         </TouchableOpacity>
//       </View>

//       {error ? <Text style={styles.errorText}>{error}</Text> : null}

//       <View style={styles.totalBudget}>
//         <Text style={styles.totalLabel}>Total Budget</Text>
//         <Text style={styles.totalAmount}>${totalBudget.toLocaleString()}</Text>
//         <View style={styles.budgetSummary}>
//           <Text style={styles.totalIncome}>Income: ${totalIncome.toLocaleString()}</Text>
//           <Text style={styles.totalSpent}>Spent: ${totalExpenses.toLocaleString()}</Text>
//           <Text style={[
//             styles.totalRemaining,
//             overspent && { color: '#FF3B30' }
//           ]}>
//             {overspent ? 'Overspent: ' : 'Remaining: '}${Math.abs(remaining).toLocaleString()}
//           </Text>
//         </View>
//       </View>

//       <View style={styles.budgetList}>
//         {budgets.map((budget, index) => (
//           <View key={budget._id} style={styles.budgetCard}>
//             <View style={styles.budgetHeader}>
//               <Text style={styles.budgetCategory}>{budget.category}</Text>
//               <View style={styles.budgetActions}>
//                 <TouchableOpacity onPress={() => {
//                   setEditingBudget(budget);
//                   setEditModalVisible(true);
//                 }}>
//                   <Pencil size={18} color="#007AFF" />
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={() => deleteBudget(budget._id)}>
//                   {/* <X size={18} color="#FF3B30" /> */}
//                 </TouchableOpacity>
//               </View>
//             </View>
            
//             <Text style={styles.budgetAmount}>
//               ${budget.status?.spent?.toLocaleString() || 0}{' '}
//               <Text style={styles.budgetTotal}>/ ${budget.amount.toLocaleString()}</Text>
//             </Text>
            
//             <View style={styles.budgetBarContainer}>
//               <View style={styles.budgetBar}>
//                 <View 
//                   style={[
//                     styles.budgetProgress,
//                     { 
//                       width: `${Math.min(budget.status?.percentage || 0, 100)}%`,
//                       backgroundColor: budget.status?.remaining && budget.status.remaining >= 0 
//                         ? colors[index % colors.length] 
//                         : '#FF3B30',
//                     }
//                   ]} 
//                 />
//               </View>
//               <Text style={styles.budgetPercentage}>
//                 {Math.round(budget.status?.percentage || 0)}%
//               </Text>
//             </View>
//           </View>
//         ))}
//       </View>

//       {/* Add Budget Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Add New Budget</Text>
//               <TouchableOpacity onPress={() => setModalVisible(false)}>
//                 {/* <X size={24} color="#8E8E93" /> */}
//               </TouchableOpacity>
//             </View>
            
//             <Text style={styles.inputLabel}>Category</Text>
//             <View style={styles.categoryContainer}>
//               {defaultCategories.map((category) => (
//                 <TouchableOpacity
//                   key={category}
//                   style={[
//                     styles.categoryButton,
//                     newBudget.category === category && styles.selectedCategory
//                   ]}
//                   onPress={() => setNewBudget({...newBudget, category})}
//                 >
//                   <Text style={[
//                     styles.categoryButtonText,
//                     newBudget.category === category && styles.selectedCategoryText
//                   ]}>
//                     {category}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <TextInput
//               style={styles.input}
//               placeholder="Or enter custom category"
//               value={newBudget.category}
//               onChangeText={(text) => setNewBudget({...newBudget, category: text})}
//             />
            
//             <Text style={styles.inputLabel}>Amount</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter amount"
//               keyboardType="numeric"
//               value={newBudget.amount}
//               onChangeText={(text) => setNewBudget({...newBudget, amount: text})}
//             />
            
//             <Text style={styles.inputLabel}>Period</Text>
//             <View style={styles.periodContainer}>
//               <TouchableOpacity
//                 style={[
//                   styles.periodButton,
//                   newBudget.period === 'monthly' && styles.selectedPeriod
//                 ]}
//                 onPress={() => setNewBudget({...newBudget, period: 'monthly'})}
//               >
//                 <Text style={[
//                   styles.periodButtonText,
//                   newBudget.period === 'monthly' && styles.selectedPeriodText
//                 ]}>
//                   Monthly
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[
//                   styles.periodButton,
//                   newBudget.period === 'yearly' && styles.selectedPeriod
//                 ]}
//                 onPress={() => setNewBudget({...newBudget, period: 'yearly'})}
//               >
//                 <Text style={[
//                   styles.periodButtonText,
//                   newBudget.period === 'yearly' && styles.selectedPeriodText
//                 ]}>
//                   Yearly
//                 </Text>
//               </TouchableOpacity>
//             </View>
            
//             <TouchableOpacity 
//               style={styles.saveButton}
//               onPress={createBudget}
//             >
//               <Text style={styles.saveButtonText}>Save Budget</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Edit Budget Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={editModalVisible}
//         onRequestClose={() => {
//           setEditModalVisible(false);
//           setEditingBudget(null);
//         }}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Edit Budget</Text>
//               <TouchableOpacity onPress={() => {
//                 setEditModalVisible(false);
//                 setEditingBudget(null);
//               }}>
//                 {/* <X size={24} color="#8E8E93" /> */}
//               </TouchableOpacity>
//             </View>
            
//             {editModalVisible && editingBudget && (
//               <>
//                 <Text style={styles.inputLabel}>Category</Text>
//                 <TextInput
//                   style={styles.input}
//                   value={editingBudget.category}
//                   onChangeText={(text) => setEditingBudget({...editingBudget, category: text})}
//                 />
                
//                 <Text style={styles.inputLabel}>Amount</Text>
//                 <TextInput
//                   style={styles.input}
//                   keyboardType="numeric"
//                   value={editingBudget.amount.toString()}
//                   onChangeText={(text) => setEditingBudget({...editingBudget, amount: Number(text) || 0})}
//                 />
                
//                 <Text style={styles.inputLabel}>Period</Text>
//                 <View style={styles.periodContainer}>
//                   <TouchableOpacity
//                     style={[
//                       styles.periodButton,
//                       editingBudget.period === 'monthly' && styles.selectedPeriod
//                     ]}
//                     onPress={() => setEditingBudget({...editingBudget, period: 'monthly'})}
//                   >
//                     <Text style={[
//                       styles.periodButtonText,
//                       editingBudget.period === 'monthly' && styles.selectedPeriodText
//                     ]}>
//                       Monthly
//                     </Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={[
//                       styles.periodButton,
//                       editingBudget.period === 'yearly' && styles.selectedPeriod
//                     ]}
//                     onPress={() => setEditingBudget({...editingBudget, period: 'yearly'})}
//                   >
//                     <Text style={[
//                       styles.periodButtonText,
//                       editingBudget.period === 'yearly' && styles.selectedPeriodText
//                     ]}>
//                       Yearly
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
                
//                 <TouchableOpacity 
//                   style={styles.saveButton}
//                   onPress={updateBudget}
//                 >
//                   <Text style={styles.saveButtonText}>Update Budget</Text>
//                 </TouchableOpacity>
//               </>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F2F2F7',
//   },
//   content: {
//     padding: 16,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 34,
//     fontWeight: '700',
//     color: '#000000',
//   },
//   addButton: {
//     backgroundColor: '#007AFF',
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   totalBudget: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 24,
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   totalLabel: {
//     fontSize: 16,
//     color: '#8E8E93',
//     marginBottom: 8,
//   },
//   totalAmount: {
//     fontSize: 48,
//     fontWeight: '700',
//     color: '#000000',
//     marginBottom: 4,
//   },
//   budgetSummary: {
//     flexDirection: 'column',
//     width: '100%',
//     marginTop: 8,
//   },
//   totalIncome: {
//     fontSize: 16,
//     color: '#34C759',
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   totalSpent: {
//     fontSize: 16,
//     color: '#FF3B30',
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   totalRemaining: {
//     fontSize: 16,
//     color: '#007AFF',
//     fontWeight: '600',
//   },
//   budgetList: {
//     gap: 16,
//   },
//   budgetCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//   },
//   budgetHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   budgetCategory: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#000000',
//   },
//   budgetActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   budgetAmount: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000000',
//     marginBottom: 12,
//   },
//   budgetTotal: {
//     color: '#8E8E93',
//     fontWeight: '400',
//   },
//   budgetBarContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   budgetBar: {
//     flex: 1,
//     height: 8,
//     backgroundColor: '#E5E5EA',
//     borderRadius: 4,
//     overflow: 'hidden',
//   },
//   budgetProgress: {
//     height: '100%',
//     borderRadius: 4,
//   },
//   budgetPercentage: {
//     fontSize: 14,
//     color: '#8E8E93',
//     width: 40,
//   },
//   errorText: {
//     color: '#FF3B30',
//     textAlign: 'center',
//     marginBottom: 16,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalContent: {
//     width: '90%',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 20,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#000000',
//   },
//   inputLabel: {
//     fontSize: 14,
//     color: '#8E8E93',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#F2F2F7',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     fontSize: 16,
//   },
//   categoryContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 12,
//   },
//   categoryButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     backgroundColor: '#F2F2F7',
//   },
//   selectedCategory: {
//     backgroundColor: '#007AFF',
//   },
//   categoryButtonText: {
//     color: '#000000',
//   },
//   selectedCategoryText: {
//     color: '#FFFFFF',
//   },
//   periodContainer: {
//     flexDirection: 'row',
//     gap: 8,
//     marginBottom: 20,
//   },
//   periodButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     backgroundColor: '#F2F2F7',
//     alignItems: 'center',
//   },
//   selectedPeriod: {
//     backgroundColor: '#007AFF',
//   },
//   periodButtonText: {
//     color: '#000000',
//   },
//   selectedPeriodText: {
//     color: '#FFFFFF',
//   },
//   saveButton: {
//     backgroundColor: '#007AFF',
//     borderRadius: 8,
//     padding: 16,
//     alignItems: 'center',
//   },
//   saveButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Pencil } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { API_URL } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Budget {
  _id: string;
  category: string;
  amount: number;
  period: string;
  user: string;
  alerts: {
    enabled: boolean;
    threshold: number;
  };
}

interface BudgetStatus {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

const colors = ['#007AFF', '#5856D6', '#FF2D55', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];
const defaultCategories = ['Food & Dining', 'Shopping', 'Entertainment', 'Transportation', 'Housing', 'Utilities', 'Healthcare'];

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const [budgets, setBudgets] = useState<Array<Budget & { status?: BudgetStatus }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Fetch transactions
      const transactionsResponse = await fetch(`${API_URL}/transactions`, { headers });
      if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions');
      const transactions = await transactionsResponse.json();

      // Calculate transaction summary
      const income = transactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const spending: Record<string, number> = {};
      transactions
        .filter((t: any) => t.type === 'expense')
        .forEach((t: any) => {
          spending[t.category] = (spending[t.category] || 0) + t.amount;
        });

      setTotalIncome(income);
      setTotalExpenses(expenses);
      setCategorySpending(spending);

      // Fetch budgets
      const budgetsResponse = await fetch(`${API_URL}/budgets`, { headers });
      if (!budgetsResponse.ok) throw new Error('Failed to fetch budgets');
      const budgetsData = await budgetsResponse.json();

      // Calculate budget status
      const budgetsWithStatus = budgetsData.map((budget: Budget) => {
        const spent = spending[budget.category] || 0;
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;

        return {
          ...budget,
          status: {
            budget: budget.amount,
            spent,
            remaining,
            percentage
          }
        };
      });

      setBudgets(budgetsWithStatus);
    } catch (err: any) {
      console.error('Error fetching data:', err);
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

  const createBudget = async () => {
    try {
      if (!newBudget.category || !newBudget.amount) {
        throw new Error('Please fill all fields');
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      const response = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: newBudget.category,
          amount: Number(newBudget.amount),
          period: newBudget.period
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create budget');
      }
      
      setModalVisible(false);
      setNewBudget({ category: '', amount: '', period: 'monthly' });
      await fetchData();
    } catch (err: any) {
      console.error('Error creating budget:', err);
      setError(err.message || 'Failed to create budget');
    }
  };

  const updateBudget = async () => {
    if (!editingBudget) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      const response = await fetch(`${API_URL}/budgets/${editingBudget._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          category: editingBudget.category,
          amount: editingBudget.amount,
          period: editingBudget.period
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update budget');
      }
      
      setEditModalVisible(false);
      setEditingBudget(null);
      await fetchData();
    } catch (err: any) {
      console.error('Error updating budget:', err);
      setError(err.message || 'Failed to update budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      Alert.alert(
        'Delete Budget',
        'Are you sure you want to delete this budget?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: async () => {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                throw new Error('Authentication token not found');
              }

              const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              };
              
              const response = await fetch(`${API_URL}/budgets/${id}`, {
                method: 'DELETE',
                headers,
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete budget');
              }
              
              await fetchData();
            },
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      setError(err.message || 'Failed to delete budget');
    }
  };

  const calculateTotals = () => {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const remaining = totalBudget - totalExpenses + totalIncome;

    return {
      totalBudget,
      remaining,
      overspent: remaining < 0
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const { totalBudget, remaining, overspent } = calculateTotals();

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Budget Overview</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setModalVisible(true)}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.totalBudget}>
        <Text style={styles.totalLabel}>Total Budget</Text>
        <Text style={styles.totalAmount}>${totalBudget.toLocaleString()}</Text>
        <View style={styles.budgetSummary}>
          <Text style={styles.totalIncome}>Income: ${totalIncome.toLocaleString()}</Text>
          <Text style={styles.totalSpent}>Spent: ${totalExpenses.toLocaleString()}</Text>
          <Text style={[
            styles.totalRemaining,
            overspent && { color: '#FF3B30' }
          ]}>
            {overspent ? 'Overspent: ' : 'Remaining: '}${Math.abs(remaining).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.budgetList}>
        {budgets.map((budget, index) => (
          <View key={budget._id} style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetCategory}>{budget.category}</Text>
              <View style={styles.budgetActions}>
                <TouchableOpacity onPress={() => {
                  setEditingBudget(budget);
                  setEditModalVisible(true);
                }}>
                  <Pencil size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteBudget(budget._id)}>
                  {/* <X size={18} color="#FF3B30" /> */}
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.budgetAmount}>
              ${budget.status?.spent?.toLocaleString() || 0}{' '}
              <Text style={styles.budgetTotal}>/ ${budget.amount.toLocaleString()}</Text>
            </Text>
            
            <View style={styles.budgetBarContainer}>
              <View style={styles.budgetBar}>
                <View 
                  style={[
                    styles.budgetProgress,
                    { 
                      width: `${Math.min(budget.status?.percentage || 0, 100)}%`,
                      backgroundColor: budget.status?.remaining && budget.status.remaining >= 0 
                        ? colors[index % colors.length] 
                        : '#FF3B30',
                    }
                  ]} 
                />
              </View>
              <Text style={styles.budgetPercentage}>
                {Math.round(budget.status?.percentage || 0)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Add Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Budget</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                {/* <X size={24} color="#8E8E93" /> */}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              {defaultCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    newBudget.category === category && styles.selectedCategory
                  ]}
                  onPress={() => setNewBudget({...newBudget, category})}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    newBudget.category === category && styles.selectedCategoryText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Or enter custom category"
              value={newBudget.category}
              onChangeText={(text) => setNewBudget({...newBudget, category: text})}
            />
            
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={newBudget.amount}
              onChangeText={(text) => setNewBudget({...newBudget, amount: text})}
            />
            
            <Text style={styles.inputLabel}>Period</Text>
            <View style={styles.periodContainer}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  newBudget.period === 'monthly' && styles.selectedPeriod
                ]}
                onPress={() => setNewBudget({...newBudget, period: 'monthly'})}
              >
                <Text style={[
                  styles.periodButtonText,
                  newBudget.period === 'monthly' && styles.selectedPeriodText
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  newBudget.period === 'yearly' && styles.selectedPeriod
                ]}
                onPress={() => setNewBudget({...newBudget, period: 'yearly'})}
              >
                <Text style={[
                  styles.periodButtonText,
                  newBudget.period === 'yearly' && styles.selectedPeriodText
                ]}>
                  Yearly
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={createBudget}
            >
              <Text style={styles.saveButtonText}>Save Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingBudget(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Budget</Text>
              <TouchableOpacity onPress={() => {
                setEditModalVisible(false);
                setEditingBudget(null);
              }}>
                {/* <X size={24} color="#8E8E93" /> */}
              </TouchableOpacity>
            </View>
            
            {editModalVisible && editingBudget && (
              <>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={editingBudget.category}
                  onChangeText={(text) => setEditingBudget({...editingBudget, category: text})}
                />
                
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editingBudget.amount.toString()}
                  onChangeText={(text) => setEditingBudget({...editingBudget, amount: Number(text) || 0})}
                />
                
                <Text style={styles.inputLabel}>Period</Text>
                <View style={styles.periodContainer}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      editingBudget.period === 'monthly' && styles.selectedPeriod
                    ]}
                    onPress={() => setEditingBudget({...editingBudget, period: 'monthly'})}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      editingBudget.period === 'monthly' && styles.selectedPeriodText
                    ]}>
                      Monthly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      editingBudget.period === 'yearly' && styles.selectedPeriod
                    ]}
                    onPress={() => setEditingBudget({...editingBudget, period: 'yearly'})}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      editingBudget.period === 'yearly' && styles.selectedPeriodText
                    ]}>
                      Yearly
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={updateBudget}
                >
                  <Text style={styles.saveButtonText}>Update Budget</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  totalBudget: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  budgetSummary: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 8,
  },
  totalIncome: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalSpent: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 4,
  },
  totalRemaining: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  budgetList: {
    gap: 16,
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  budgetTotal: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  budgetBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: 14,
    color: '#8E8E93',
    width: 40,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  inputLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#000000',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#000000',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});