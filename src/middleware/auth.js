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