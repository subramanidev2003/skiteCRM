import express from 'express';
import SEOClient from '../models/SEOClient.js';
import SEORequirement from '../models/SEORequirement.js';
import Task from '../models/Task.js';
import User from '../models/userModel.js';

const router = express.Router();

// --- SEO CLIENTS ---

// 1. Get All SEO Clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await SEOClient.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Add New SEO Client
router.post('/clients/add', async (req, res) => {
  try {
    const newClient = new SEOClient(req.body);
    await newClient.save();
    res.status(201).json(newClient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Get Single SEO Client Details
router.get('/client/:id', async (req, res) => {
  try {
    const client = await SEOClient.findById(req.params.id).populate('assignedDev', 'name');
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Update SEO Client Details & Status
router.put('/client/update/:id', async (req, res) => {
  try {
    const updated = await SEOClient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. DELETE SEO Client (Cascade Delete Requirements & Tasks)
router.delete('/clients/delete/:id', async (req, res) => {
  try {
    const clientId = req.params.id;

    const client = await SEOClient.findById(clientId);
    if (!client) return res.status(404).json({ error: "SEO Client not found" });

    // a. Find all Requirements for this Client
    const requirements = await SEORequirement.find({ clientId: clientId });

    // b. Extract Task IDs
    const taskIds = requirements.map(req => req.assignedTaskId).filter(id => id != null);

    // c. Delete Associated Tasks
    if (taskIds.length > 0) {
      await Task.deleteMany({ _id: { $in: taskIds } });
    }

    // d. Delete Associated SEO Requirements
    await SEORequirement.deleteMany({ clientId: clientId });

    // e. Finally Delete the Client
    await SEOClient.findByIdAndDelete(clientId);

    res.status(200).json({ message: "SEO Client and associated data deleted successfully" });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});


// --- SEO REQUIREMENTS & CHANGES ---

// 6. Get SEO Requirements by Client
router.get('/requirements/:clientId', async (req, res) => {
  try {
    const items = await SEORequirement.find({ clientId: req.params.clientId })
      .populate('assignedTo', 'name')
      .populate('assignedTaskId', 'status')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Add SEO Requirement/Change & Auto-Assign Task
router.post('/requirements/add', async (req, res) => {
  try {
    const { clientId, type, description, assignedTo } = req.body;

    let taskId = null;

    // Create Task for SEO Specialist
    if (assignedTo) {
      const task = new Task({
        // WebDev-la panna athe Clean Title & Description logic
        title: description.substring(0, 40), 
        description: description, 
        assignedTo: assignedTo,
        priority: 'High',
        dueDate: new Date(), 
        status: 'Pending'
      });
      const savedTask = await task.save();
      taskId = savedTask._id;
    }

    const newReq = new SEORequirement({
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

// 8. DELETE Single SEO Requirement/Change
router.delete('/requirements/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const requirement = await SEORequirement.findById(id);
    if (!requirement) return res.status(404).json({ error: "SEO Item not found" });

    // Clean up Linked Task
    if (requirement.assignedTaskId) {
      await Task.findByIdAndDelete(requirement.assignedTaskId);
    }

    // Delete SEO Requirement
    await SEORequirement.findByIdAndDelete(id);

    res.status(200).json({ message: "SEO Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;