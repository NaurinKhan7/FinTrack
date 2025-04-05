// // const express = require('express');
// // const { body, validationResult } = require('express-validator');
// // const Budget = require('../models/Budget');
// // const Transaction = require('../models/Transaction');
// // const auth = require('../middleware/auth');

// // const router = express.Router();

// // // Get all budgets
// // router.get('/', auth, async (req, res) => {
// //   try {
// //     const budgets = await Budget.find({ user: req.user.userId });
// //     res.json(budgets);
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // });

// // // Create new budget
// // router.post('/',
// //   [
// //     auth,
// //     body('category').notEmpty(),
// //     body('amount').isNumeric(),
// //     body('period').isIn(['monthly', 'yearly'])
// //   ],
// //   async (req, res) => {
// //     try {
// //       const errors = validationResult(req);
// //       if (!errors.isEmpty()) {
// //         return res.status(400).json({ errors: errors.array() });
// //       }

// //       const budget = new Budget({
// //         ...req.body,
// //         user: req.user.userId
// //       });

// //       await budget.save();
// //       res.status(201).json(budget);
// //     } catch (error) {
// //       console.error(error);
// //       res.status(500).json({ message: 'Server error' });
// //     }
// //   }
// // );

// // // Update budget
// // router.put('/:id',
// //   [
// //     auth,
// //     body('amount').optional().isNumeric(),
// //     body('alerts').optional().isObject()
// //   ],
// //   async (req, res) => {
// //     try {
// //       const errors = validationResult(req);
// //       if (!errors.isEmpty()) {
// //         return res.status(400).json({ errors: errors.array() });
// //       }

// //       let budget = await Budget.findOne({
// //         _id: req.params.id,
// //         user: req.user.userId
// //       });

// //       if (!budget) {
// //         return res.status(404).json({ message: 'Budget not found' });
// //       }

// //       budget = await Budget.findByIdAndUpdate(
// //         req.params.id,
// //         { $set: req.body },
// //         { new: true }
// //       );

// //       res.json(budget);
// //     } catch (error) {
// //       console.error(error);
// //       res.status(500).json({ message: 'Server error' });
// //     }
// //   }
// // );

// // // Get budget status
// // router.get('/:id/status', auth, async (req, res) => {
// //   try {
// //     const budget = await Budget.findOne({
// //       _id: req.params.id,
// //       user: req.user.userId
// //     });

// //     if (!budget) {
// //       return res.status(404).json({ message: 'Budget not found' });
// //     }

// //     const startDate = new Date();
// //     startDate.setDate(1); // Start of current month

// //     const expenses = await Transaction.aggregate([
// //       {
// //         $match: {
// //           user: req.user.userId,
// //           category: budget.category,
// //           type: 'expense',
// //           date: { $gte: startDate }
// //         }
// //       },
// //       {
// //         $group: {
// //           _id: null,
// //           total: { $sum: '$amount' }
// //         }
// //       }
// //     ]);

// //     const spent = expenses[0]?.total || 0;
// //     const remaining = budget.amount - spent;
// //     const percentage = (spent / budget.amount) * 100;

// //     res.json({
// //       budget: budget.amount,
// //       spent,
// //       remaining,
// //       percentage
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // });

// // module.exports = router;

// const express = require('express');
// const { body, validationResult } = require('express-validator');
// const Budget = require('../models/Budget');
// const Transaction = require('../models/Transaction');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // Get all budgets
// router.get('/', auth, async (req, res) => {
//   try {
//     const budgets = await Budget.find({ user: req.user.userId });
//     res.json(budgets);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Create new budget
// router.post('/',
//   [
//     auth,
//     body('category').notEmpty(),
//     body('amount').isNumeric(),
//     body('period').isIn(['monthly', 'yearly'])
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const budget = new Budget({
//         ...req.body,
//         user: req.user.userId
//       });

//       await budget.save();
//       res.status(201).json(budget);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   }
// );

// // Update budget
// router.put('/:id',
//   [
//     auth,
//     body('amount').optional().isNumeric(),
//     body('alerts').optional().isObject()
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       let budget = await Budget.findOne({
//         _id: req.params.id,
//         user: req.user.userId
//       });

//       if (!budget) {
//         return res.status(404).json({ message: 'Budget not found' });
//       }

//       budget = await Budget.findByIdAndUpdate(
//         req.params.id,
//         { $set: req.body },
//         { new: true }
//       );

//       res.json(budget);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   }
// );

// // Get budget status
// router.get('/:id/status', auth, async (req, res) => {
//   try {
//     const budget = await Budget.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!budget) {
//       return res.status(404).json({ message: 'Budget not found' });
//     }

//     // Get start of current period (monthly/yearly)
//     const startDate = new Date();
//     if (budget.period === 'monthly') {
//       startDate.setDate(1); // Start of current month
//       startDate.setHours(0, 0, 0, 0);
//     } else { // yearly
//       startDate.setMonth(0, 1); // January 1st
//       startDate.setHours(0, 0, 0, 0);
//     }

//     // Calculate income and expenses for the period
//     const [incomeResult, expensesResult] = await Promise.all([
//       Transaction.aggregate([
//         {
//           $match: {
//             user: req.user.userId,
//             type: 'income',
//             date: { $gte: startDate }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: '$amount' }
//           }
//         }
//       ]),
//       Transaction.aggregate([
//         {
//           $match: {
//             user: req.user.userId,
//             category: budget.category,
//             type: 'expense',
//             date: { $gte: startDate }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             total: { $sum: '$amount' }
//           }
//         }
//       ])
//     ]);

//     const income = incomeResult[0]?.total || 0;
//     const spent = expensesResult[0]?.total || 0;
    
//     // Calculate adjusted budget (original + portion of income)
//     const incomeContribution = budget.period === 'monthly' ? income : income / 12;
//     const adjustedBudget = budget.amount + incomeContribution;
//     const remaining = adjustedBudget - spent;
//     const percentage = adjustedBudget > 0 ? (spent / adjustedBudget) * 100 : 0;

//     res.json({
//       budget: budget.amount,
//       incomeContribution,
//       adjustedBudget,
//       spent,
//       remaining,
//       percentage,
//       period: budget.period
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete budget
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const budget = await Budget.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!budget) {
//       return res.status(404).json({ message: 'Budget not found' });
//     }

//     await budget.remove();
//     res.json({ message: 'Budget removed' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

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