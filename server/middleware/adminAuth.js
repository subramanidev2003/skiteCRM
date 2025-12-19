// middleware/adminAuth.js

const adminAuth = async (req, res, next) => {
  try {
    // At this point, userAuth has already run and set req.userId and req.userRole
    
    // console.log('🔐 adminAuth middleware called');
    // console.log('User ID:', req.userId);
    // console.log('User Role:', req.userRole);
    
    // 1. Check if userRole exists
    if (!req.userRole) {
      console.log('❌ adminAuth: FAILED. No user role found.');
      return res.status(403).json({ 
        message: "Access denied. User role not found." 
      });
    }
    
    // 2. Convert to lowercase to prevent case-sensitivity bugs
    const userRole = req.userRole.toLowerCase();
    
    // ✅ UPDATED LOGIC: Allow BOTH 'admin' and 'manager'
    if (userRole === 'admin' || userRole === 'manager') {
      console.log(`✅ adminAuth: PASSED. User is ${userRole}.`);
      next(); // Authorized, proceed to the route handler
    } else {
      console.log(`❌ adminAuth: FAILED. User is ${req.userRole}, restricted role.`);
      return res.status(403).json({ 
        message: "Access denied. Admin or Manager privileges required." 
      });
    }
    
  } catch (error) {
    console.error('❌ adminAuth Error:', error);
    return res.status(500).json({ 
      message: "Server error in authorization" 
    });
  }
};

export default adminAuth; 