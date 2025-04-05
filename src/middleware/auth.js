// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   try {
//     const token = req.header('Authorization').replace('Bearer ', '');
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Authentication required' });
//   }
// };

// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   // Get token from header
//   const authHeader = req.header('Authorization');
//   if (!authHeader) {
//     return res.status(401).json({ message: 'No token, authorization denied' });
//   }

//   // Extract token
//   const token = authHeader.replace('Bearer ', '');
  
//   if (!token) {
//     return res.status(401).json({ message: 'No token, authorization denied' });
//   }

//   // Verify token
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.error('Token verification error:', err.message);
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided or invalid format' 
    });
  }

  // Extract token
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      
      let message = 'Invalid token';
      if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
      } else if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
      }
      
      return res.status(401).json({ 
        success: false,
        message 
      });
    }
    
    req.user = decoded;
    next();
  });
};