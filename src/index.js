// // require('dotenv').config();
// // const express = require('express');
// // const mongoose = require('mongoose');
// // const cors = require('cors');
// // const authRoutes = require('./routes/auth');
// // const transactionRoutes = require('./routes/transactions');
// // const budgetRoutes = require('./routes/budgets');

// // const app = express();

// // // Middleware
// // app.use(cors());
// // app.use(express.json());

// // // Routes
// // app.use('/api/auth', authRoutes);
// // app.use('/api/transactions', transactionRoutes);
// // app.use('/api/budgets', budgetRoutes);

// // // Connect to MongoDB
// // mongoose.connect(process.env.MONGODB_URI)
// //   .then(() => console.log('Connected to MongoDB'))
// //   .catch(err => console.error('MongoDB connection error:', err));

// // // Error handling middleware
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);
// //   res.status(500).json({ message: 'Something went wrong!' });
// // });

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`Server running on port ${PORT}`);
// // });

// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const authRoutes = require('./routes/auth');
// const transactionRoutes = require('./routes/transactions');
// const budgetRoutes = require('./routes/budgets');

// // Initialize Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Logging middleware (useful for debugging)
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path}`);
//   next();
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/budgets', budgetRoutes);

// // MongoDB Connection
// const connectToDatabase = async () => {
//   const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
  
//   if (!dbUri) {
//     console.error('ERROR: MONGODB_URI not found in environment variables');
//     console.log('Please create a .env file with MONGODB_URI=mongodb://localhost:27017/finance-tracker');
//     process.exit(1);
//   }

//   try {
//     await mongoose.connect(dbUri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000,
//       maxPoolSize: 10 // Maximum number of connections in the pool
//     });
//     console.log('✅ Successfully connected to MongoDB');
//   } catch (error) {
//     console.error('❌ MongoDB connection error:', error.message);
//     console.log('Troubleshooting tips:');
//     console.log('1. Make sure MongoDB is running (try running "mongod" in terminal)');
//     console.log('2. Verify your connection string in .env file');
//     console.log('3. Check if port 27017 is accessible');
//     process.exit(1);
//   }
// };

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'UP',
//     database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
//     timestamp: new Date().toISOString()
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     message: 'Internal Server Error',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // Start server
// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectToDatabase();
  
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI}`);
//     console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
//   });
// };

// startServer().catch(err => {
//   console.error('Failed to start server:', err);
//   process.exit(1);
// });

// // Handle graceful shutdown
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   console.log('MongoDB connection closed');
//   process.exit(0);
// });

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');

// Initialize Express app
const app = express();
// Middleware
app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);

// MongoDB Connection with proper configuration
const connectToDatabase = async () => {
  // Use default URI if .env is not configured
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
  
  try {
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,  // 5 second timeout
      maxPoolSize: 10,                // Maximum connections
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
      family: 4                       // Use IPv4, skip IPv6
    });
    
    // Verify connection is actually established
    await mongoose.connection.db.admin().ping();
    
    console.log('✅ MongoDB successfully connected');
    console.log('📊 Database Details:', {
      Host: mongoose.connection.host,
      Port: mongoose.connection.port,
      Name: mongoose.connection.name,
      State: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Actively check connection status
    const dbStatus = mongoose.connection.readyState;
    let dbHealthy = false;
    
    if (dbStatus === 1) {
      await mongoose.connection.db.admin().ping();
      dbHealthy = true;
    }
    
    res.status(200).json({
      status: 'UP',
      database: dbHealthy ? 'CONNECTED' : 'DISCONNECTED',
      details: {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        dbName: mongoose.connection.name,
        ping: dbHealthy ? 'OK' : 'FAILED'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'DOWN',
      error: 'Database health check failed',
      details: err.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}`, err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectToDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 MongoDB: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏱️  Started at: ${new Date().toISOString()}`);
    });
  } catch (err) {
    console.error('💥 Failed to start server:', err);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Start the application
startServer();