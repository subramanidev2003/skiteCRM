import mongoose from "mongoose";
import Task from "../models/Task.js"; // Import the model we just created
import User from "../models/userModel.js";
// CREATE TASK
export const createTask = async (req, res) => {
  const { title, description, priority, dueDate, assignedTo } = req.body;

  if (!title || !description || !dueDate || !assignedTo) {
    return res.status(400).json({ message: "Please fill all required fields." });
  }
  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    return res.status(400).json({ message: "Invalid assignedTo user ID." });
  }

  try {
    const newTask = new Task({
      title,
      description,
      priority,
      dueDate: new Date(dueDate),
      assignedTo,
      status: "Pending",
    });

    await newTask.save();
    // Populate immediately to return full user details
    await newTask.populate("assignedTo", "name role");
    
    res.status(201).json({ message: "Task created successfully.", task: newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task due to a server error." });
  }
};



export const getAllTasks = async (req, res) => {
  try {
    let query = {};

    // ✅ CHECK FOR MANAGER ROLE
    // If the role is Manager (Capital 'M' based on your logs), filter tasks
    if (req.userRole === 'Manager' || req.userRole === 'manager') {
      const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];
      
      // Find eligible users first
      const eligibleUsers = await User.find({ 
        designation: { $in: allowedDesignations } 
      }).select('_id');
      
      const userIds = eligibleUsers.map(u => u._id);
      query.assignedTo = { $in: userIds };
    }

    // ✅ ENSURE POPULATE IS CORRECT
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email designation') // Must include designation
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error in getAllTasks:", error);
    res.status(500).json({ message: "Server Error fetching tasks" });
  }
};

// GET TASKS FOR SPECIFIC EMPLOYEE
// GET TASKS FOR SPECIFIC EMPLOYEE
export const getEmployeeTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query; 

    // ✅ DEBUG LOGS
    // console.log("--------------- GET EMPLOYEE TASKS ---------------");
    // console.log("1. Requested User ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("❌ Invalid ID format");
      return res.status(400).json({ message: "Invalid employee ID." });
    }

    let query = { assignedTo: userId };

    if (status && ["Pending", "In Progress", "Completed"].includes(status)) {
      query.status = status;
    }

    console.log("2. Database Query:", query);

    const tasks = await Task.find(query)
      .populate("assignedTo", "name role email")
      .sort({ dueDate: 1 });

    console.log(`3. Tasks Found: ${tasks.length}`);
    
    res.status(200).json(tasks); 
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    res.status(500).json({ message: "Server Error fetching tasks" });
  }
};

// UPDATE TASK STATUS
// UPDATE TASK STATUS
export const updateTaskStatus = async (req, res) => {
  try {
    // console.log("🔥 updateTaskStatus - STARTED");
    // console.log("📥 Request Params:", req.params);
    // console.log("📥 Request Body:", req.body);
    // console.log("📥 Request Headers:", req.headers);
    // console.log("📥 Full URL:", req.originalUrl);

    const { taskId } = req.params;
    const { status } = req.body;

    // console.log("🔍 Parsed values - taskId:", taskId, "status:", status);

    if (!taskId || taskId.trim() === "") {
      console.log("❌ Missing taskId parameter");
      return res.status(400).json({ message: "Task ID is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      console.log("❌ Invalid ObjectId:", taskId);
      return res.status(400).json({ message: "Invalid task ID format." });
    }

    if (!status || !["Pending", "In Progress", "Completed"].includes(status)) {
      console.log("❌ Invalid status value:", status);
      return res.status(400).json({ 
        message: "Invalid status value. Must be one of: Pending, In Progress, Completed." 
      });
    }

    // console.log("🔍 Finding task with ID:", taskId);
    
    // First, find the task to ensure it exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      console.log("❌ Task not found in database:", taskId);
      return res.status(404).json({ message: "Task not found." });
    }
    
    // console.log("✅ Task found:", existingTask.title);

    // Update the task
    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true, runValidators: true } // Added runValidators
    ).populate("assignedTo", "name role email");

    if (!task) {
      console.log("❌ Task update failed - no task returned");
      return res.status(500).json({ message: "Task update failed unexpectedly." });
    }

    // console.log("✅ Task updated successfully:", {
    //   taskId: task._id,
    //   newStatus: task.status,
    //   title: task.title
    // });

    res.status(200).json({ 
      message: "Task updated successfully.", 
      task 
    });
    
  } catch (error) {
    console.error("💥 ERROR in updateTaskStatus:", error);
    console.error("Error stack:", error.stack);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: error.message 
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid ID format" 
      });
    }
    
    res.status(500).json({ 
      message: "Server Error while updating task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ 
      message: "Task deleted successfully",
      deletedTask: { 
        id: deletedTask._id, 
        title: deletedTask.title 
      }
    });

  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({ message: "Server error while deleting task" });
  }
};