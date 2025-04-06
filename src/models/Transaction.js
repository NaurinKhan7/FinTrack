const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

const router = express.Router();

// Improved helper function to ensure budget exists for category
const ensureBudgetExists = async (userId, category) => {
  try {
    const normalizedCategory = category.trim();
    
    // Case-insensitive search for existing budget
    const existingBudget = await Budget.findOne({
      user: userId,
      category: { $regex: new RegExp(`^${normalizedCategory}$`, 'i') }
    }).collation({ locale: 'en', strength: 2 });

    if (!existingBudget) {
      // Create new budget with default values
      const newBudget = new Budget({
        user: userId,
        category: normalizedCategory,
        amount: 0, // Default amount
        period: 'monthly'
      });
      await newBudget.save();
      return newBudget;
    }
    return existingBudget;
  } catch (error) {
    console.error('Error ensuring budget exists:', error);
    // Return the error instead of throwing to prevent transaction failure
    return { error: error.message };
  }
};
// Improved budget status updater
const updateBudgetStatus = async (userId) => {
  try {
    const startDate = new Date();
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get all transactions for the current period
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate }
    });

    // Get all budgets for the user
    const budgets = await Budget.find({ user: userId });

    // For each expense transaction, ensure a budget exists
    const expenseCategories = [...new Set(
      transactions
        .filter(t => t.type === 'expense')
        .map(t => t.category.trim())
    )];

    // Create missing budgets
    for (const category of expenseCategories) {
      const exists = budgets.some(b => 
        b.category.toLowerCase() === category.toLowerCase()
      );
      if (!exists) {
        await ensureBudgetExists(userId, category);
      }
    }
  } catch (error) {
    console.error('Error updating budget status:', error);
    // Don't throw error to prevent transaction failure
    return { error: error.message };
  }
};
// Create transaction with automatic budget handling
// Update the POST /transactions route
router.post('/',
  [
    auth,
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('date').optional().isISO8601().withMessage('Date must be valid ISO format')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { type, amount, category, description } = req.body;
      const userId = req.user.userId;
      const normalizedCategory = category.trim();

      // Debugging log
      console.log(`Creating transaction for user ${userId}, category: ${normalizedCategory}`);

      // Create transaction
      const transaction = new Transaction({
        type,
        amount,
        category: normalizedCategory,
        description: description.trim(),
        date: req.body.date ? new Date(req.body.date) : new Date(),
        user: userId
      });

      await transaction.save();

      // Only handle budgets for expenses
      if (type === 'expense') {
        try {
          // Debugging log
          console.log(`Ensuring budget exists for ${normalizedCategory}`);
          
          // Use findOneAndUpdate with upsert to handle existing budgets
          await Budget.findOneAndUpdate(
            { 
              user: userId,
              category: { $regex: new RegExp(`^${normalizedCategory}$`, 'i') }
            },
            { $setOnInsert: { 
              amount: 0,
              period: 'monthly'
            }},
            { 
              upsert: true,
              collation: { locale: 'en', strength: 2 },
              new: true
            }
          );

          // Debugging log
          console.log(`Budget ensured for ${normalizedCategory}`);
        } catch (budgetError) {
          console.error('Budget handling error:', budgetError);
          // Continue even if budget update fails
        }
      }

      res.status(201).json({
        success: true,
        transaction
      });
    } catch (error) {
      console.error('Transaction creation error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create transaction',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);
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

// Get budget status for all categories
router.get('/budget-status', auth, async (req, res) => {
  try {
    // Get all budgets for the user
    const budgets = await Budget.find({ user: req.user.userId });
    
    // Get current period's transactions
    const startDate = new Date();
    startDate.setDate(1);
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
    for (const budget of budgets) {
      const categoryExpenses = transactions
        .filter(t => t.type === 'expense' && 
          t.category.toLowerCase() === budget.category.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);

      const adjustedBudget = budget.amount + (totalIncome * (budget.period === 'monthly' ? 1 : 1/12));
      const remaining = adjustedBudget - categoryExpenses;
      const percentage = adjustedBudget > 0 ? (categoryExpenses / adjustedBudget) * 100 : 0;

      categorySpending[budget.category] = {
        budget: budget.amount,
        incomeContribution: (totalIncome * (budget.period === 'monthly' ? 1 : 1/12)),
        spent: categoryExpenses,
        remaining,
        percentage,
        period: budget.period
      };
    }

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
      message: 'Server error',
      error: error.message
    });
  }
});

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
      res.status(500).json({ 
        message: 'Server error',
        error: error.message
      });
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
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;