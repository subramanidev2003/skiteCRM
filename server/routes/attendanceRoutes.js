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

        // 1. Logged-in user details (middleware moolama kidaikum)
        const userRole = req.userRole ? req.userRole.toLowerCase() : '';
        const userDesignation = req.userDesignation ? req.userDesignation.toLowerCase() : '';

        // 2. Access Control Check
        // Manager-ah iruntha specific designations mattum kaattu
        if (userRole === 'manager') {
            const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];
            const eligibleUsers = await User.find({ designation: { $in: allowedDesignations } }).select('_id');
            const userIds = eligibleUsers.map(u => u._id);
            query.userId = { $in: userIds };
        } 
        // Admin illai Content Writer-ah irunthaal FULL access (No filters in query)
        else if (userRole === 'admin' || userDesignation.includes('content writ')) {
            // No additional filters, query stays empty {} to fetch all
        } 
        // Vera yaaraachum (Normal Employee) intha URL-ku vanthaal, avanga data mattum kaattu (Security)
        else {
            query.userId = req.userId;
        }

        // Fetch Records
        const attendanceRecords = await Attendance.find(query)
            .populate('userId', 'name email designation salaryPerDay') 
            .sort({ checkInTime: -1 }); 

        const formattedRecords = attendanceRecords.map(record => ({
            id: record._id, 
            _id: record._id, 
            userId: record.userId, 
            employeeName: record.userId?.name || 'Unknown',
            designation: record.userId?.designation || 'N/A', 
            checkInTime: record.checkInTime, 
            checkOutTime: record.checkOutTime,
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