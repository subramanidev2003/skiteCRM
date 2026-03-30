import express from 'express';
import Leave from '../models/Leave.js'; // .js extension அவசியம்

const router = express.Router();

// 1. Create Leave Request
router.post('/create', async (req, res) => {
  try {
    const { userId, name, designation, fromDate, toDate, reason } = req.body;
    
    const newLeave = new Leave({
      userId,
      name,
      designation,
      fromDate,
      toDate,
      reason
    });

    await newLeave.save();
    res.status(201).json({ message: "Leave request submitted successfully", leave: newLeave });
  } catch (err) {
    res.status(500).json({ message: "Error creating leave request", error: err.message });
  }
});

// 2. Get All Leave Requests
router.get('/all', async (req, res) => {
  // console.log("🚀 GET ALL LEAVES API CALLED!");
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Error fetching leaves", error: err.message });
  }
});

// 3. Update Leave Status
router.put('/update/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLeave = await Leave.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!updatedLeave) return res.status(404).json({ message: "Leave not found" });

    res.status(200).json({ message: `Leave ${status}`, leave: updatedLeave });
  } catch (err) {
    res.status(500).json({ message: "Error updating leave", error: err.message });
  }
});

// 4. Delete Leave Request
router.delete('/delete/:id', async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Leave deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ முக்கியம்: இது இருந்தால் தான் error போகும்
export default router;