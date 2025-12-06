import express from 'express';
import { registerEmployee, login, logout, adminLogin, registerUser,adminLogout } from '../controllers/authController.js';

// 1. ✅ KEEP THIS: Import the already fully configured middleware
import upload from '../middleware/multerConfig.js'; 
// 2. ❌ REMOVE THIS: You don't need to import multer itself if you configured it elsewhere.
// import multer from 'multer'; 

const authRouter = express.Router();

// 3. ❌ REMOVE THESE CONFIGURATION LINES (These caused the 'Identifier already declared' error)
// const storage = multer.diskStorage({ ... });
// const upload = multer({ storage: storage });


// 4. ✅ CORRECT: Use the imported 'upload' middleware directly
// This is the clean way to use middleware configured in a separate file.
authRouter.post('/register', upload.single('image'), registerEmployee);

authRouter.post('/login', login);
authRouter.post('/logout', logout);


// Admin-only login
authRouter.post("/admin-login", adminLogin);
authRouter.post('/admin-logout', adminLogout);

// Registration (Admin Only or open — your choice)
authRouter.post("/adminregister", registerUser);

export default authRouter;