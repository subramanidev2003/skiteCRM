import express from "express";
import multer from "multer";
// import path from "path";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import { 
    getUserdata, 
    getAllEmployees, 
    getEmployeeDetails, 
    deleteUser,
    updateUser // Import the new update function
} from "../controllers/userController.js"; 

const userRouter = express.Router();

// ================================
// MULTER CONFIGURATION
// ================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure this folder exists in your project root
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-originalname
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// ================================
// ROUTES
// ================================

userRouter.get("/data", userAuth, getUserdata);
userRouter.get('/all', userAuth, adminAuth, getAllEmployees);
userRouter.get("/:id", userAuth, adminAuth, getEmployeeDetails);
userRouter.delete("/delete/:id", userAuth, adminAuth, deleteUser); 

// ✅ Update Route with Multer Middleware
// We use upload.single('image') because the frontend sends the file in a field named 'image'
userRouter.put("/edit/:id", userAuth, adminAuth, upload.single('image'), updateUser);

export default userRouter;