import express from 'express';
import ContentPlan from '../models/ContentPlan.js';
import Task from '../models/Task.js';
import User from '../models/userModel.js';

const router = express.Router();

// 1. FETCH USERS BY ROLE (Dropdown ku theva)
// routes/content.js

// GET USERS BY ROLE (With Smart Typo Handling)
router.get('/users/:role', async (req, res) => {
    try {
        const { role } = req.params;
        let searchCriteria = [];

        // 1. CONTENT WRITER LOGIC (Handle "Writer" vs "Writter")
        if (role.toLowerCase().includes('writer')) {
            searchCriteria = [
                { designation: { $regex: 'Content Writer', $options: 'i' } },
                { designation: { $regex: 'Content Writter', $options: 'i' } }, // ✅ Typos handled
                { role: { $regex: 'Writer', $options: 'i' } }
            ];
        } 
        // 2. VIDEO EDITOR LOGIC
        else if (role.toLowerCase().includes('editor')) {
            searchCriteria = [
                { designation: { $regex: 'Video Editor', $options: 'i' } },
                { designation: { $regex: 'Editor', $options: 'i' } },
                { role: { $regex: 'Editor', $options: 'i' } }
            ];
        } 
        // 3. DEFAULT LOGIC (For any other role)
        else {
            searchCriteria = [
                { designation: { $regex: role, $options: 'i' } },
                { role: { $regex: role, $options: 'i' } }
            ];
        }

        // Execute Search with OR condition
        const users = await User.find({ $or: searchCriteria }).select('name designation role _id');
        
        res.json(users);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. UNIFIED ADD CONTENT ROUTE
router.post('/add', async (req, res) => {
    try {
        const { clientId, type, date, startTime, endTime, details, assignedTo } = req.body;

        if (!clientId) return res.status(400).json({ error: "Client ID required" });

        let assignedUserId = assignedTo; // For Script/Edit (Selected from dropdown)
        let taskId = null;

        // --- AUTOMATION LOGIC ---

        // A. POSTING: Auto-assign to 'Bhuvana'
        if (type === 'Post') {
            const bhuvanaUser = await User.findOne({ name: { $regex: 'Bhuvana', $options: 'i' } });
            if (bhuvanaUser) {
                assignedUserId = bhuvanaUser._id;
            } else {
                console.log("User 'Bhuvana' not found in database.");
            }
        }

        // B. CREATE TASK (If a user is assigned)
        // Shoot ku task theva illa nu sonneenga, so Script, Edit, Post ku mattum task create aagum.
        if (assignedUserId && (type === 'Script' || type === 'Edit' || type === 'Post')) {
            const newTask = new Task({
                title: `${type} Task: ${details.substring(0, 20)}...`,
                description: `Type: ${type}\nDate: ${new Date(date).toDateString()}\nTime: ${startTime} - ${endTime}\nDetails: ${details}`,
                assignedTo: assignedUserId,
                priority: type === 'Post' ? 'High' : 'Medium',
                dueDate: date,
                status: 'Pending'
            });
            const savedTask = await newTask.save();
            taskId = savedTask._id;
        }

        // C. SAVE CONTENT PLAN
        const newContent = new ContentPlan({
            clientId,
            type,
            date,
            startTime,
            endTime,
            details,
            status: 'Pending',
            assignedToUser: assignedUserId || null,
            assignedTaskId: taskId || null
        });

        await newContent.save();
        res.status(201).json({ message: `${type} Added Successfully`, data: newContent });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET CONTENT (Existing Logic)
router.get('/client/:clientId', async (req, res) => {
    try {
        const items = await ContentPlan.find({ clientId: req.params.clientId })
            .populate('assignedTaskId') // To show Task Status
            .populate('assignedToUser', 'name') // To show Employee Name
            .sort({ date: -1 });
        res.status(200).json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE STATUS & DELETE (Use existing logic, simplified)
router.put('/update-status/:id', async (req, res) => {
    try {
        const updated = await ContentPlan.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE CONTENT
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params; // ✅ Idhu romba mukkiyam!
    
    console.log("Deleting ID:", id); // Check panna log potrukom

    // 1. Check if item exists
    const content = await ContentPlan.findById(id);
    if (!content) {
        console.log("Item not found in DB");
        return res.status(404).json({ error: "Item not found" });
    }

    // 2. Delete Linked Task (if any)
    if (content.assignedTaskId) {
      await Task.findByIdAndDelete(content.assignedTaskId);
      // console.log("Linked Task Deleted");
    }

    // 3. Delete the Content Plan
    await ContentPlan.findByIdAndDelete(id);
    // console.log("Content Plan Deleted Successfully");

    res.status(200).json({ message: "Item and associated task deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;