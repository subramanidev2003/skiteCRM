// middleware/adminAuth.js

const adminAuth = async (req, res, next) => {
  try {
    // At this point, userAuth has already run and set req.userId and req.userRole
    
    console.log('🔐 adminAuth middleware called');
    console.log('User ID:', req.userId);
    console.log('User Role:', req.userRole);
    
    // Check if userRole exists
    if (!req.userRole) {
      console.log('❌ adminAuth: FAILED. No user role found.');
      return res.status(403).json({ 
        message: "Access denied. User role not found." 
      });
    }
    
    // ✅ FIXED: Case-insensitive comparison and support both "Admin" and "admin"
    const userRole = req.userRole.toLowerCase();
    
    if (userRole !== 'admin') {
      console.log(`❌ adminAuth: FAILED. User is ${req.userRole}, not 'admin'.`);
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }
    
    console.log('✅ adminAuth: PASSED. User is admin.');
    next(); // User is admin, proceed to the route handler
    
  } catch (error) {
    console.error('❌ adminAuth Error:', error);
    return res.status(500).json({ 
      message: "Server error in admin authentication" 
    });
  }
};

export default adminAuth;