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

// ✅ NEW: BULK MARK ATTENDANCE (Holidays & Sundays)
// Ippo admin oru date-ah add panna ella employee-kum auto-ah present aagidum
router.post('/bulk-mark', userAuth, adminAuth, async (req, res) => {
    try {
        const { date, employees, checkIn, checkOut, taskDescription } = req.body;

        if (!date || !employees || !Array.isArray(employees)) {
            return res.status(400).json({ msg: "Missing required bulk data" });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Ovvoru employee ID-kum loop panni records create pannuvom
        const operations = employees.map(async (empId) => {
            // Check if record already exists for this date to avoid duplicates
            const existing = await Attendance.findOne({
                userId: empId,
                checkInTime: { $gte: startOfDay, $lte: endOfDay }
            });

            if (!existing) {
                const newRecord = new Attendance({
                    userId: empId,
                    checkInTime: new Date(checkIn),
                    checkOutTime: new Date(checkOut),
                    taskDescription: taskDescription, // Ippo "Sunday" or "Holiday" nu vizhum
                    status: "Present"
                });
                return newRecord.save();
            }
        });

        await Promise.all(operations);
        res.status(201).json({ msg: "Bulk attendance marked successfully!" });
    } catch (error) {
        console.error('Bulk attendance error:', error);
        res.status(500).json({ msg: 'Server error during bulk operation' });
    }
});

// --- GET ALL (Manager & Admin Full View) ---   
router.get('/all', userAuth, async (req, res) => {
    try {
        let query = {};

        const userRole = req.userRole ? req.userRole.toLowerCase() : '';
        const userDesignation = req.userDesignation ? req.userDesignation.toLowerCase() : '';

        // ✅ UPDATED ACCESS CONTROL: 
        // Admin, Manager, and Content Writer ippo FULL access (Ellaraiyum paarkalaam)
        if (userRole === 'admin' || userRole === 'manager' || userRole === 'officer' || userDesignation.includes('content writ')) {
            // query stays empty {} to fetch all records
        } 
        // Others can only see their own records
        else {
            query.userId = req.userId;
        }

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