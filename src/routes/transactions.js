const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to update budget status
const updateBudgetStatus = async (userId) => {
  try {
    const budgets = await Budget.find({ user: userId });
    const startDate = new Date();
    startDate.setDate(1); // Start of current month
    startDate.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate }
    });

    // Calculate total income for the period
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Update each budget's status
    for (const budget of budgets) {
      const categoryExpenses = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      const adjustedBudget = budget.amount + (income * (budget.period === 'monthly' ? 1 : 1/12));
      const remaining = adjustedBudget - categoryExpenses;
      const percentage = adjustedBudget > 0 ? (categoryExpenses / adjustedBudget) * 100 : 0;

      // You could store this or just calculate on the fly
    }
  } catch (error) {
    console.error('Error updating budget status:', error);
  }
};

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new transaction
router.post('/',
  [
    auth,
    body('type').isIn(['income', 'expense']),
    body('amount').isNumeric(),
    body('category').notEmpty(),
    body('description').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // For expenses, check budget
      if (req.body.type === 'expense') {
        const budget = await Budget.findOne({ 
          user: req.user.userId,
          category: req.body.category 
        });

        if (budget) {
          const statusRes = await fetch(`${API_URL}/budgets/${budget._id}/status`, {
            headers: { 'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}` }
          });
          
          if (statusRes.ok) {
            const status = await statusRes.json();
            if (status.remaining < req.body.amount) {
              return res.status(400).json({ 
                message: `This expense would exceed your ${req.body.category} budget by $${(req.body.amount - status.remaining).toFixed(2)}` 
              });
            }
          }
        }
      }

      const transaction = new Transaction({
        ...req.body,
        user: req.user.userId
      });

      await transaction.save();
      await updateBudgetStatus(req.user.userId);
      res.status(201).json(transaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update transaction
router.put('/:id',
  [
    auth,
    body('amount').optional().isNumeric(),
    body('category').optional().notEmpty(),
    body('description').optional().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let transaction = await Transaction.findOne({
        _id: req.params.id,
        user: req.user.userId
      });

      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      transaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      await updateBudgetStatus(req.user.userId);
      res.json(transaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.remove();
    await updateBudgetStatus(req.user.userId);
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get budget status for all categories
router.get('/budget-status', auth, async (req, res) => {
  try {
    // Get all budgets for the user
    const budgets = await Budget.find({ user: req.user.userId });
    
    // Get current period's transactions
    const startDate = new Date();
    startDate.setDate(1); // First day of current month
    startDate.setHours(0, 0, 0, 0);
    
    const transactions = await Transaction.find({ 
      user: req.user.userId,
      date: { $gte: startDate }
    });

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate spending by category with budget info
    const categorySpending = {};
    budgets.forEach(budget => {
      const categoryExpenses = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      const adjustedBudget = budget.amount + (totalIncome * (budget.period === 'monthly' ? 1 : 1/12));
      const remaining = adjustedBudget - categoryExpenses;

      categorySpending[budget.category] = {
        budget: budget.amount,
        incomeContribution: (totalIncome * (budget.period === 'monthly' ? 1 : 1/12)),
        spent: categoryExpenses,
        remaining,
        percentage: adjustedBudget > 0 ? (categoryExpenses / adjustedBudget) * 100 : 0
      };
    });

    res.json({
      success: true,
      totalIncome,
      totalBudget: budgets.reduce((sum, b) => sum + b.amount, 0),
      totalSpent: totalExpenses,
      remaining: budgets.reduce((sum, b) => sum + b.amount, 0) + totalIncome - totalExpenses,
      categorySpending
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;