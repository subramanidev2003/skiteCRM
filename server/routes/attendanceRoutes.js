import express from "express";
import { 
  checkin, 
  checkout, 
  getAttendanceHistory 
} from "../controllers/attendanceController.js";
import Attendance from "../models/Attendance.js";
import User from "../models/userModel.js"; 
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import mongoose from 'mongoose';

const router = express.Router();

// --- POST ROUTES ---
router.post("/checkin", checkin); 
router.post("/checkout", checkout);

// --- GET ALL (Manager Filtered & Payroll Ready) ---
router.get('/all', userAuth, async (req, res) => {
    try {
        let query = {};
        
        // Manager Logic: Only show specific designations
        if (req.userRole && req.userRole.toLowerCase() === 'manager') {
            const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];
            const eligibleUsers = await User.find({ designation: { $in: allowedDesignations } }).select('_id');
            const userIds = eligibleUsers.map(u => u._id);
            query.userId = { $in: userIds };
        }

        // Fetch Records
        const attendanceRecords = await Attendance.find(query)
            // ✅ FIX 1: Added 'salaryPerDay' to populate
            .populate('userId', 'name email designation salaryPerDay') 
            .sort({ checkInTime: -1 }); 

        const formattedRecords = attendanceRecords.map(record => ({
            id: record._id, 
            _id: record._id, 
            
            // ✅ FIX 2: CRITICAL! Included userId object so Payroll page can filter by employee
            userId: record.userId, 

            employeeName: record.userId?.name || 'Unknown',
            designation: record.userId?.designation || 'N/A', 
            
            // Send correctly named fields for Frontend
            checkInTime: record.checkInTime, 
            checkOutTime: record.checkOutTime,
            
            // Keep existing fields for compatibility
            date: record.checkInTime,
            checkIn: record.checkInTime,
            checkOut: record.checkOutTime,
            
            taskDescription: record.taskDescription,
            duration: record.checkOutTime ? Math.floor((new Date(record.checkOutTime) - new Date(record.checkInTime)) / 1000) : null
        }));

        res.json(formattedRecords);
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// --- GET STATUS ---
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const activeSession = await Attendance.findOne({ userId: userId, checkOutTime: null }).sort({ checkInTime: -1 });
        
        if (activeSession) {
            return res.json({ isCheckedIn: true, checkInTime: activeSession.checkInTime });
        }
        return res.json({ isCheckedIn: false });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// --- DELETE ROUTES ---
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
        res.status(200).json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during deletion' });
    }
});

router.delete('/bulkdelete', userAuth, adminAuth, async (req, res) => {
    const { ids } = req.body; 
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Must provide a non-empty array of IDs' });
    }
    
    try {
        const result = await Attendance.deleteMany({ _id: { $in: ids } });
        res.status(200).json({ message: `${result.deletedCount} records deleted successfully.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error during bulk deletion' });
    }
});

// --- GET HISTORY FOR SPECIFIC USER ---
router.get('/:userId', userAuth, getAttendanceHistory);

export default router;