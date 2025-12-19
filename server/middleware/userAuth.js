// // src/middleware/userAuth.js (CORRECTED)
// import jwt from "jsonwebtoken";

// const userAuth = (req, res, next) => {
//     // 🔍 DEBUG: Log which endpoint is being called
//     // console.log("🔐 Auth middleware called for:", req.method, req.originalUrl);
    
//     const authHeader = req.header('Authorization');
//     // console.log("📨 Authorization header:", authHeader ? "Present" : "MISSING");

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         // console.log("❌ Token missing or malformed");
//         return res.status(401).json({ message: "Access denied. Token missing." });
//     }

//     const token = authHeader.replace('Bearer ', '');

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.userId = decoded.id;  // ✅ Sets req.userId
//         // console.log("✅ Token valid for userId:", req.userId);
//         next();
//     } catch (err) {
//         // console.log("❌ Token verification failed:", err.message);
//         return res.status(401).json({ message: "Invalid or expired token." });
//     }
// };

// export default userAuth;




// middleware/userAuth.js

import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const userAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: "No token provided. Authorization denied." 
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: "No token provided. Authorization denied." 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // console.log('🔓 Token decoded:', decoded);
    
    // Get user from database to get the latest role
    const user = await userModel.findById(decoded.id).select('_id role name email');
    
    if (!user) {
      return res.status(401).json({ 
        message: "User not found. Authorization denied." 
      });
    }
    
    // ✅ IMPORTANT: Set both userId and userRole on req object
    req.userId = user._id;
    req.userRole = user.role; // This is crucial for adminAuth
    req.user = user; // Optional: attach full user object
    
    // console.log('✅ userAuth: User authenticated');
    // console.log('   User ID:', req.userId);
    // console.log('   User Role:', req.userRole);
    
    next(); // Proceed to next middleware or route handler
    
  } catch (error) {
    console.error('❌ userAuth Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: "Invalid token. Authorization denied." 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Token expired. Please login again." 
      });
    }
    
    return res.status(500).json({ 
      message: "Server error in authentication" 
    });
  }
};

export default userAuth;
