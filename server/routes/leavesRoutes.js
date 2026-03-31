import express from 'express';
import Leave from '../models/Leave.js';
import Attendance from '../models/Attendance.js'; // ✅ Puthusa add pannirukkom
import Task from '../models/Task.js';             // ✅ Puthusa add pannirukkom

const router = express.Router();

// 1. Create Leave Request (Updated with leaveType)
router.post('/create', async (req, res) => {
  try {
    const { userId, name, designation, fromDate, toDate, reason, leaveType } = req.body;
    
    const newLeave = new Leave({
      userId,
      name,
      designation,
      fromDate,
      toDate,
      reason,
      leaveType // ✅ Sick, Casual, or Permission dropdown value
    });

    await newLeave.save();
    res.status(201).json({ message: "Leave request submitted successfully", leave: newLeave });
  } catch (err) {
    res.status(500).json({ message: "Error creating leave request", error: err.message });
  }
});

// 2. Get All Leave Requests
router.get('/all', async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Error fetching leaves", error: err.message });
  }
});

// 3. Update Leave Status (Master Trigger for CL)
// router.put('/update/:id', ...) kulla intha logic-ai replace pannunga

router.put('/update/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.status = status;
    const updatedLeave = await leave.save();

    // ✅ CASUAL LEAVE APPROVE AANAA MATTUM ATTENDANCE PANNANUM
  // server/routes/leavesRoutes.js - Inside the Approved + Casual Leave block 

if (status === 'Approved' && leave.leaveType === 'Casual Leave') {
    let start = new Date(leave.fromDate);
    let end = new Date(leave.toDate);

    while (start <= end) {
        // Proper Date Objects create panrom
        const checkIn = new Date(start);
        checkIn.setHours(9, 30, 0); 

        const checkOut = new Date(start);
        checkOut.setHours(18, 30, 0);

        await Attendance.create({
            userId: leave.userId,
            employeeName: leave.name, // 👈 Romba Mukkiyam: Search filter-ku ithu venum
            designation: leave.designation,
            
            // ✅ Unga Frontend filter intha field-ah thaan check pannuthu
            date: new Date(start), 
            checkInTime: checkIn, 
            checkOutTime: checkOut,
            
            status: 'Present',
            isCL: true,
            taskDescription: "Casual Leave (Auto-Present)"
        });

        start.setDate(start.getDate() + 1);
    }
    console.log("✅ Attendance created for dates:", leave.fromDate, "to", leave.toDate);
}

    res.status(200).json({ message: `Leave ${status}`, leave: updatedLeave });
  } catch (err) {
    console.error("❌ CL Error:", err);
    res.status(500).json({ error: err.message });
  }
});
// 4. Get Admin CL Reports (Puthu API for CL Dashboard)
router.get('/cl-reports', async (req, res) => {
  try {
    const { from, to } = req.query; // Date range filter
    let query = { leaveType: 'Casual Leave', status: 'Approved' };

    if (from && to) {
      query.fromDate = { $gte: new Date(from), $lte: new Date(to) };
    }

    const reports = await Leave.find(query).populate('userId', 'name designation');
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete Leave Request
router.delete('/delete/:id', async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Leave deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;  