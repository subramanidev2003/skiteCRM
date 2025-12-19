import express from "express";
import { 
    createTask, 
    getAllTasks, 
    getEmployeeTasks, 
    updateTaskStatus, 
    deleteTask 
} from "../controllers/taskController.js";
import userAuth from "../middleware/userAuth.js"; 
import adminAuth from "../middleware/adminAuth.js";

const taskRouter = express.Router();

// 1. Create Task - Now allowed for Admin AND Manager (via your updated adminAuth)
taskRouter.post("/create", userAuth, createTask); 

// 2. Get All Tasks - Used by Admin/Manager Dashboards
// Order matters: Keep "/all" ABOVE "/:userId"
taskRouter.get("/all", userAuth, adminAuth, getAllTasks); 

// 3. Delete Task
taskRouter.delete("/delete/:id", userAuth, adminAuth, deleteTask);

// 4. Employee Specific Tasks (Employee Dashboard)
// We REMOVE adminAuth here because a regular employee needs to access their own tasks
taskRouter.get("/:userId", userAuth, getEmployeeTasks); 

// 5. Update Task Status (Employee Dashboard)
taskRouter.post("/:taskId/status", userAuth, updateTaskStatus); 

export default taskRouter;