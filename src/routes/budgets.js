const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate budget status
async function calculateBudgetStatus(budget, transactions, totalIncome) {
  const categoryExpenses = transactions
    .filter(t => t.type === 'expense' && t.category === budget.category)
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeContribution = budget.period === 'monthly' ? totalIncome : totalIncome / 12;
  const adjustedBudget = budget.amount + incomeContribution;
  const remaining = adjustedBudget - categoryExpenses;
  const percentage = adjustedBudget > 0 ? (categoryExpenses / adjustedBudget) * 100 : 0;

  return {
    budget: budget.amount,
    incomeContribution,
    adjustedBudget,
    spent: categoryExpenses,
    remaining,
    percentage,
    period: budget.period
  };
}

// Get all budgets with status
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.userId });
    
    // Get current period's transactions
    const startDate = new Date();
    startDate.setDate(1); // First day of current month
    startDate.setHours(0, 0, 0, 0);
    
    const transactions = await Transaction.find({ 
      user: req.user.userId,
      date: { $gte: startDate }
    });

    // Calculate total income
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Enhance budgets with status
    const budgetsWithStatus = await Promise.all(budgets.map(async (budget) => {
      const status = await calculateBudgetStatus(budget, transactions, totalIncome);
      return {
        ...budget.toObject(),
        status
      };
    }));

    res.json(budgetsWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new budget
router.post('/',
  [
    auth,
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('period').isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const budget = new Budget({
        ...req.body,
        user: req.user.userId
      });

      await budget.save();
      res.status(201).json(budget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Update budget
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const budget = await Budget.findOneAndDelete({ 
      _id: id, 
      user: req.user.userId 
    });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ 
      message: 'Budget deleted successfully',
      deletedBudget: budget 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;