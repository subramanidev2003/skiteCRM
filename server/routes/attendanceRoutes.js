// routes/attendanceRoutes.js
import express from "express";
import { checkin, checkout } from "../controllers/attendanceController.js";
import Attendance from "../models/Attendance.js";
import userAuth from "../middleware/userAuth.js"; // Import userAuth
import adminAuth from "../middleware/adminAuth.js"; // Import adminAuth
import mongoose from 'mongoose';

const router = express.Router();

router.post("/checkin", checkin);
router.post("/checkout", checkout);

// GET /api/attendance/all - Fetch all attendance records
// Use userAuth if employees can see this, or use the chain for admin only.
router.get('/all', userAuth, async (req, res) => {
    // ... (Your fetch all attendance logic remains the same)
    try {
        const attendanceRecords = await Attendance.find({})
            .populate('userId', 'name email')
            .sort({ checkInTime: -1 })
            .limit(100); 

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return res.json([]); 
        }

        const formattedRecords = attendanceRecords.map(record => ({
            id: record._id, 
            _id: record._id, 
            employeeName: record.userId?.name || 'Unknown',
            employeeEmail: record.userId?.email || 'N/A',
            date: record.checkInTime,
            checkIn: record.checkInTime,
            checkOut: record.checkOutTime,
            taskDescription: record.taskDescription,
            duration: record.checkOutTime 
                ? Math.floor((new Date(record.checkOutTime) - new Date(record.checkInTime)) / 1000)
                : null
        }));

        res.json(formattedRecords);

    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ msg: 'Server error fetching attendance' });
    }
});

// GET /api/attendance/status/:userId
router.get('/status/:userId', async (req, res) => {
    // ... (Your status logic remains the same)
    try {
        const { userId } = req.params;
        const activeSession = await Attendance.findOne({
            userId: userId,
            checkOutTime: null
        }).sort({ checkInTime: -1 });
        
        if (activeSession) {
            return res.json({
                isCheckedIn: true,
                checkInTime: activeSession.checkInTime
            });
        }
        return res.json({ isCheckedIn: false });
    } catch (error) {
        console.error('Error checking session status:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// 1. 🚨 CRITICAL FIX: CHAIN MIDDLEWARE FOR DELETION
// Run userAuth first to set req.userId, then adminAuth to check the role.
router.delete('/deleterec/:id', userAuth, adminAuth, async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
        const result = await Attendance.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.status(200).json({ 
            message: 'Record deleted successfully', 
            deletedRecord: result 
        });
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        res.status(500).json({ message: 'Server error during deletion' });
    }
});

// 2. 🚨 CRITICAL FIX: CHAIN MIDDLEWARE FOR BULK DELETION
router.delete('/bulkdelete', userAuth, adminAuth, async (req, res) => {
    // ... (Your bulk delete logic remains the same)
    const { ids } = req.body; 

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Must provide a non-empty array of IDs' });
    }
    
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));

    try {
        const result = await Attendance.deleteMany({
            _id: { $in: objectIds }
        });

        res.status(200).json({
            message: `${result.deletedCount} records deleted successfully.`,
            deletedCount: result.deletedCount,
            totalAttempted: ids.length,
        });
    } catch (error) {
        console.error('Error during bulk deletion:', error);
        res.status(500).json({ message: 'Server error during bulk deletion' });
    }
});

export default router;