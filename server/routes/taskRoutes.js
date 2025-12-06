import express from "express";
import { 
    createTask, 
    getAllTasks, 
    getEmployeeTasks, 
    updateTaskStatus, 
    deleteTask 
} from "../controllers/taskController.js";
// Assuming you have an authentication middleware for protected routes
import userAuth from "../middleware/userAuth.js"; 
import adminAuth from "../middleware/adminAuth.js";

const taskRouter = express.Router();
// POST /api/tasks/create - Create a new task (Admin/Manager role typically)
taskRouter.post("/create", userAuth,adminAuth, createTask); 
// --- Employee Routes (Used by EmployeeDashboard.jsx) ---
// GET /api/tasks/all - Fetch all tasks, potentially with filters (Admin view)
// Note: This route must be listed *after* the GET /:userId route to prevent "/all" from being interpreted as a userId
taskRouter.get("/all", userAuth,adminAuth, getAllTasks); 
// GET /api/tasks/:userId - Fetch all tasks assigned to a specific user
// The EmployeeDashboard uses this route to fetch tasks: `${TASKS_URL}/${EMPLOYEE_ID}`
taskRouter.get("/:userId", userAuth, adminAuth,getEmployeeTasks); 

// PATCH /api/tasks/:taskId/status - Toggle task status 
// The EmployeeDashboard uses this route to complete/uncomplete tasks: `${TASKS_URL}/${taskId}/status`
taskRouter.post("/:taskId/status", userAuth, updateTaskStatus); 
taskRouter.delete("/delete/:id", userAuth, adminAuth, deleteTask);

// --- Admin/Management Routes ---





// DELETE /api/tasks/:taskId - Delete a task (Admin/Manager role typically)
// taskRouter.delete("/:taskId", userAuth, deleteTask);

export default taskRouter;