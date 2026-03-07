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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: "No token provided. Authorization denied." 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: "No token provided. Authorization denied." 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ UPDATED: Added 'designation' in select to fetch it from DB
    const user = await userModel.findById(decoded.id).select('_id role name email designation');
    
    if (!user) {
      return res.status(401).json({ 
        message: "User not found. Authorization denied." 
      });
    }
    
    req.userId = user._id;
    req.userRole = user.role; 
    // ✅ NEW: Attaching designation to req object
    req.userDesignation = user.designation || ""; 
    req.user = user; 
    
    next(); 
    
  } catch (error) {
    console.error('❌ userAuth Error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token. Authorization denied." });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    return res.status(500).json({ message: "Server error in authentication" });
  }
};

export default userAuth;