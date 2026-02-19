import express from 'express';
import WebDevClient from '../models/WebDevClient.js';
import WebDevRequirement from '../models/WebDevRequirement.js';
import Task from '../models/Task.js';
import User from '../models/userModel.js';

const router = express.Router();

// --- CLIENTS ---

// 1. Get All Web Dev Clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await WebDevClient.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Add New Client
router.post('/clients/add', async (req, res) => {
  try {
    const newClient = new WebDevClient(req.body);
    await newClient.save();
    res.status(201).json(newClient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Get Single Client Details
router.get('/client/:id', async (req, res) => {
  try {
    const client = await WebDevClient.findById(req.params.id).populate('assignedDev', 'name'); // ✅ populate updated
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Update Client Overview & Edit Details
// (இது Frontend-ல் Edit Details மற்றும் Status மாற்றுவது இரண்டிற்கும் வேலை செய்யும்)
router.put('/client/update/:id', async (req, res) => {
  try {
    const updated = await WebDevClient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ 5. NEW: DELETE Client (Cascade Delete Requirements & Tasks)
router.delete('/clients/delete/:id', async (req, res) => {
  try {
    const clientId = req.params.id;

    const client = await WebDevClient.findById(clientId);
    if (!client) return res.status(404).json({ error: "Client not found" });

    // a. இந்த Client-க்கு உள்ள எல்லா Requirements-ஐயும் கண்டுபிடி
    const requirements = await WebDevRequirement.find({ clientId: clientId });

    // b. அந்த Requirements-ல் உள்ள Task ID-களை பிரித்தெடு
    const taskIds = requirements.map(req => req.assignedTaskId).filter(id => id != null);

    // c. சம்மந்தப்பட்ட Tasks-ஐ அழி (Delete Tasks)
    if (taskIds.length > 0) {
      await Task.deleteMany({ _id: { $in: taskIds } });
    }

    // d. சம்மந்தப்பட்ட Requirements-ஐ அழி (Delete Requirements)
    await WebDevRequirement.deleteMany({ clientId: clientId });

    // e. கடைசியாக Client-ஐ அழி (Delete Client)
    await WebDevClient.findByIdAndDelete(clientId);

    res.status(200).json({ message: "Client and all associated data deleted successfully" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});


// --- REQUIREMENTS & CHANGES ---

// 6. Get Requirements by Client
router.get('/requirements/:clientId', async (req, res) => {
  try {
    const items = await WebDevRequirement.find({ clientId: req.params.clientId })
      .populate('assignedTo', 'name')
      .populate('assignedTaskId', 'status') // Fetch linked task status
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Add Requirement/Change & Assign Task
router.post('/requirements/add', async (req, res) => {
  try {
    const { clientId, type, description, assignedTo } = req.body;

    let taskId = null;

    // Create Task for Employee
    if (assignedTo) {
      const task = new Task({
        title: `WebDev ${type}: ${description.substring(0, 20)}...`,
        description: `Project: Web Development\nType: ${type}\nDetails: ${description}`,
        assignedTo: assignedTo,
        priority: 'High',
        dueDate: new Date(), // Set to today or handle date input
        status: 'Pending'
      });
      const savedTask = await task.save();
      taskId = savedTask._id;
    }

    const newReq = new WebDevRequirement({
      clientId,
      type,
      description,
      assignedTo,
      assignedTaskId: taskId
    });

    await newReq.save();
    res.status(201).json(newReq);

  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. Update Requirement Status
router.put('/requirements/update-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await WebDevRequirement.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. DELETE Single Requirement/Change
router.delete('/requirements/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the requirement first
    const requirement = await WebDevRequirement.findById(id);
    if (!requirement) return res.status(404).json({ error: "Item not found" });

    // 2. Delete Linked Task (Clean up)
    if (requirement.assignedTaskId) {
      await Task.findByIdAndDelete(requirement.assignedTaskId);
    }

    // 3. Delete the Requirement
    await WebDevRequirement.findByIdAndDelete(id);

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;