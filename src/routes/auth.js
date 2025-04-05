// const express = require('express');
// const { body, validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // Register user
// router.post('/register',
//   [
//     body('email').isEmail().normalizeEmail(),
//     body('password').isLength({ min: 6 }),
//     body('name').trim().notEmpty()
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const { email, password, name } = req.body;

//       // Check if user exists
//       let user = await User.findOne({ email });
//       if (user) {
//         return res.status(400).json({ message: 'User already exists' });
//       }

//       // Create new user
//       user = new User({ email, password, name });
//       await user.save();

//       // Generate token
//       const token = jwt.sign(
//         { userId: user._id },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//       );

//       res.status(201).json({ token });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   }
// );

// // Login user
// router.post('/login',
//   [
//     body('email').isEmail().normalizeEmail(),
//     body('password').exists()
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const { email, password } = req.body;

//       // Check if user exists
//       const user = await User.findOne({ email });
//       if (!user) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }

//       // Check password
//       const isMatch = await user.comparePassword(password);
//       if (!isMatch) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }

//       // Generate token
//       const token = jwt.sign(
//         { userId: user._id },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//       );

//       res.json({ token });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   }
// );

// // Get user profile
// router.get('/me', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId).select('-password');
//     res.json(user);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;

// const express = require('express');
// const { body, validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // Helper function to generate token
// const generateToken = (userId) => {
//   return jwt.sign(
//     { userId },
//     process.env.JWT_SECRET,
//     { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//   );
// };

// // Register user
// router.post('/register',
//   [
//     body('email').isEmail().normalizeEmail(),
//     body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
//     body('name').trim().notEmpty().withMessage('Name is required')
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ 
//           success: false,
//           errors: errors.array() 
//         });
//       }

//       const { email, password, name } = req.body;

//       // Check if user exists
//       let user = await User.findOne({ email });
//       if (user) {
//         return res.status(400).json({ 
//           success: false,
//           message: 'User already exists' 
//         });
//       }

//       // Create new user
//       user = new User({ email, password, name });
//       await user.save();

//       // Generate token
//       const token = generateToken(user._id);

//       res.status(201).json({
//         success: true,
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           createdAt: user.createdAt
//         }
//       });
//     } catch (error) {
//       console.error('Registration error:', error);
//       res.status(500).json({ 
//         success: false,
//         message: 'Server error during registration' 
//       });
//     }
//   }
// );

// // Login user
// router.post('/login',
//   [
//     body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
//     body('password').exists().withMessage('Password is required')
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ 
//           success: false,
//           errors: errors.array() 
//         });
//       }

//       const { email, password } = req.body;

//       // Check if user exists
//       const user = await User.findOne({ email });
//       if (!user) {
//         return res.status(400).json({ 
//           success: false,
//           message: 'Invalid credentials' 
//         });
//       }

//       // Check password
//       const isMatch = await user.comparePassword(password);
//       if (!isMatch) {
//         return res.status(400).json({ 
//           success: false,
//           message: 'Invalid credentials' 
//         });
//       }

//       // Generate token
//       const token = generateToken(user._id);

//       res.json({
//         success: true,
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           createdAt: user.createdAt
//         }
//       });
//     } catch (error) {
//       console.error('Login error:', error);
//       res.status(500).json({ 
//         success: false,
//         message: 'Server error during login' 
//       });
//     }
//   }
// );

// // Get user profile
// router.get('/me', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.userId)
//       .select('-password -__v')
//       .lean();

//     if (!user) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'User not found' 
//       });
//     }

//     res.json({
//       success: true,
//       user
//     });
//   } catch (error) {
//     console.error('Profile error:', error);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error fetching profile' 
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);

    res.status(201).json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with password explicitly selected
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;