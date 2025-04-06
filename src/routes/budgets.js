const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to calculate budget status
async function calculateBudgetStatus(budget, transactions, totalIncome) {
  const categoryExpenses = transactions
    .filter(t => t.type === 'expense' && 
      t.category.toLowerCase() === budget.category.toLowerCase())
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

// Get all budgets with status (including auto-created ones)
router.get('/', auth, async (req, res) => {
  try {
    let budgets = await Budget.find({ user: req.user.userId });
    
    // Get current period's transactions
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const transactions = await Transaction.find({ 
      user: req.user.userId,
      date: { $gte: startDate }
    });

    // Get all unique expense categories from transactions
    const expenseCategories = [...new Set(
      transactions
        .filter(t => t.type === 'expense')
        .map(t => t.category.trim())
    )];

    // Ensure budgets exist for all expense categories
    for (const category of expenseCategories) {
      const exists = budgets.some(b => 
        b.category.toLowerCase() === category.toLowerCase()
      );
      if (!exists) {
        const newBudget = new Budget({
          user: req.user.userId,
          category,
          amount: 0,
          period: 'monthly'
        });
        await newBudget.save();
        budgets = await Budget.find({ user: req.user.userId }); // Refresh budgets
      }
    }

    // Calculate total income
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Enhance budgets with status
    const budgetsWithStatus = await Promise.all(
      budgets.map(async budget => ({
        ...budget.toObject(),
        status: await calculateBudgetStatus(budget, transactions, totalIncome)
      }))
    );

    res.json(budgetsWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Create new budget
router.post('/',
  [
    auth,
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
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
        category: req.body.category.trim(),
        user: req.user.userId
      });

      await budget.save();
      res.status(201).json(budget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message 
      });
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
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
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
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;