import express from 'express';
import ContentPlan from '../models/ContentPlan.js';
import Task from '../models/Task.js';
import User from '../models/userModel.js';
import SocialMediaClient from '../models/SocialMediaClient.js'; 

const router = express.Router();

// ==========================================
// 1. ADD SHOOT (With Task for Content Writer)
// ==========================================
router.post('/add-shoot', async (req, res) => {
  try {
    const { scriptTitle, shootDate, shootDetails, clientId } = req.body;

    // Validation
    if (!clientId) {
        return res.status(400).json({ error: "Client ID is required" });
    }

    // A. Find a Content Writer
    const writer = await User.findOne({ designation: { $regex: /content/i } });
    let taskId = null;

    // B. If Writer found, Create Task
    if (writer) {
      const newTask = new Task({
        title: `Script: ${scriptTitle}`,
        description: `Write script for shoot on ${new Date(shootDate).toDateString()}. Details: ${shootDetails}`,
        assignedTo: writer._id,
        priority: 'High',
        dueDate: shootDate,
        status: 'Pending'
      });
      const savedTask = await newTask.save();
      taskId = savedTask._id;
    }

    // C. Create Content Plan Entry
    const newContent = new ContentPlan({
      clientId, 
      type: 'Shoot',
      scriptTitle,
      shootDate,
      shootDetails,
      shootStatus: 'Pending',
      assignedTaskId: taskId,
      assignedToUser: writer ? writer._id : null
    });

    await newContent.save();
    res.status(201).json({ message: "Shoot Added & Task Assigned", data: newContent });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ADD EDIT (With Task for Video Editor)
// ==========================================
router.post('/add-edit', async (req, res) => {
  try {
    const { clientId, scriptTitle, editDate, editDetails } = req.body;

    if (!clientId) return res.status(400).json({ error: "Client ID required" });

    // A. Find Video Editor
    const editor = await User.findOne({ designation: { $regex: /editor/i } });
    let taskId = null;

    // B. Create Task for Editor
    if (editor) {
      const newTask = new Task({
        title: `Edit: ${scriptTitle}`,
        description: `Editing Instructions: ${editDetails}. Deadline: ${new Date(editDate).toDateString()}`,
        assignedTo: editor._id,
        priority: 'Medium',
        dueDate: editDate,
        status: 'Pending'
      });
      const savedTask = await newTask.save();
      taskId = savedTask._id;
    }

    // C. Save Content Plan
    const newContent = new ContentPlan({
      clientId,
      type: 'Edit',
      scriptTitle,
      editDate,
      editDetails,
      editStatus: 'Pending',
      assignedTaskId: taskId,
      assignedToUser: editor ? editor._id : null
    });

    await newContent.save();
    res.status(201).json({ message: "Edit Plan Added", data: newContent });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. ADD POST (Simple Plan Creation)
// ==========================================
router.post('/add-post', async (req, res) => {
  try {
    const { clientId, scriptTitle, postDate, caption } = req.body;

    if (!clientId) return res.status(400).json({ error: "Client ID required" });

    const newContent = new ContentPlan({
      clientId,
      type: 'Post',
      scriptTitle, // Used as Caption Topic
      postDate,
      caption,
      postStatus: 'Pending'
    });

    await newContent.save();
    res.status(201).json({ message: "Post Plan Added", data: newContent });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. GET CONTENT BY CLIENT ID (For Project Page)
// ==========================================
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Filter by Client ID and Populate Task details
    const items = await ContentPlan.find({ clientId: clientId })
                                   .populate('assignedTaskId')
                                   .sort({ createdAt: -1 });
                                   
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. UPDATE STATUS (Dynamic for Shoot/Edit/Post)
// ==========================================
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status, type } = req.body; // Frontend sends: { status: 'Completed', type: 'Edit' }
    
    let updateFields = {};

    // Check type and update corresponding status field
    if (type === 'Shoot') {
        updateFields.shootStatus = status;
    } else if (type === 'Edit') {
        updateFields.editStatus = status;
    } else if (type === 'Post') {
        updateFields.postStatus = status;
    } else {
        // Fallback (Old logic support)
        updateFields.shootStatus = status; 
    }

    const updated = await ContentPlan.findByIdAndUpdate(
        req.params.id, 
        updateFields, 
        { new: true }
    );
    
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. GET SINGLE CLIENT DETAILS (For Header)
// ==========================================
router.get('/client-details/:id', async (req, res) => {
  try {
    const client = await SocialMediaClient.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE CONTENT
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the content first to check for assigned tasks
    const content = await ContentPlan.findById(id);
    if (!content) return res.status(404).json({ error: "Item not found" });

    // 2. If there is a linked Task, delete it too (Clean up)
    if (content.assignedTaskId) {
      await Task.findByIdAndDelete(content.assignedTaskId);
    }

    // 3. Delete the Content Plan
    await ContentPlan.findByIdAndDelete(id);

    res.status(200).json({ message: "Item and associated task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==========================================
// 7. GET ALL ITEMS (Admin/Overview View)
// ==========================================
router.get('/all', async (req, res) => {
  try {
    const items = await ContentPlan.find().populate('assignedTaskId').sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;