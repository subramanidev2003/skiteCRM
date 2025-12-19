// ============================================
// FILE 1: controllers/attendanceController.js
// ============================================
import userModel from "../models/userModel.js";
import Attendance from "../models/Attendance.js";
import mongoose from 'mongoose';

// --- CHECK IN ---
export const checkin = async (req, res) => {
  const { userId } = req.body; 

  console.log("🚀 Checkin Request Received");
  console.log("📋 User ID:", userId);

  try {
    if (!userId) return res.status(400).json({ msg: "User ID is required" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ msg: "Invalid User ID format" });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const activeSession = await Attendance.findOne({ userId: userId, checkOutTime: null }).sort({ checkInTime: -1 });

    if (activeSession) {
      return res.status(400).json({ msg: "User is already checked in.", checkInTime: activeSession.checkInTime });
    }

    const checkInTime = new Date();
    const newAttendance = new Attendance({
      userId: user._id,
      checkInTime: checkInTime,
      checkOutTime: null,
      status: "Checked In",
      taskDescription: ""
    });

    await newAttendance.save();
    res.status(200).json({ msg: "Checked in successfully", checkInTime: checkInTime, attendanceId: newAttendance._id });

  } catch (error) {
    console.error("🔥 Checkin Error:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// --- CHECK OUT ---
export const checkout = async (req, res) => {
  const { userId, taskDescription } = req.body;
  
  try {
    if (!userId) return res.status(400).json({ msg: "User ID is required" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ msg: "Invalid User ID format" });

    const activeSession = await Attendance.findOne({ userId: userId, checkOutTime: null }).sort({ checkInTime: -1 });

    if (!activeSession) return res.status(404).json({ msg: "No active check-in session found." });

    const checkOutTime = new Date();
    activeSession.checkOutTime = checkOutTime;
    activeSession.taskDescription = taskDescription || "";
    activeSession.status = "Checked Out";

    await activeSession.save();
    
    res.status(200).json({
      msg: "Checked out successfully",
      checkInTime: activeSession.checkInTime,
      checkOutTime: checkOutTime,
      taskDescription: activeSession.taskDescription
    });

  } catch (error) {
    console.error("🔥 Checkout Error:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ✅ NEW FUNCTION: GET ATTENDANCE HISTORY FOR A SINGLE USER
export const getAttendanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid User ID format" });
    }

    // Find ALL records for this user, sorted by newest first
    const history = await Attendance.find({ userId })
      .sort({ checkInTime: -1 })
      .select('checkInTime checkOutTime taskDescription status');

    // Return empty array if none found, instead of 404
    res.status(200).json(history || []);
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    res.status(500).json({ msg: "Server Error fetching history" });
  }
};

// ============================================
// FILE 2: routes/attendanceRoutes.js
// ============================================

// import express from "express";
// import { checkin, checkout } from "../controllers/attendanceController.js";
// import Attendance from "../models/Attendance.js";
// import userAuth from "../middleware/userAuth.js";
// import adminAuth from "../middleware/adminAuth.js";
// import mongoose from 'mongoose';

// const router = express.Router();

// // ✅ CHECK IN & CHECK OUT - NO AUTH (if you want employees to check in without token)
// // OR use userAuth if you want to require authentication
// router.post("/checkin", checkin);
// router.post("/checkout", checkout);

// // If you want authentication:
// // router.post("/checkin", userAuth, checkin);
// // router.post("/checkout", userAuth, checkout);

// // GET /api/attendance/status/:userId - Check if user is currently checked in
// router.get('/status/:userId', async (req, res) => {
//   console.log("🔍 Checking attendance status for:", req.params.userId);
  
//   try {
//     const { userId } = req.params;
    
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ msg: "Invalid User ID format" });
//     }

//     const activeSession = await Attendance.findOne({
//       userId: userId,
//       checkOutTime: null
//     }).sort({ checkInTime: -1 });
    
//     if (activeSession) {
//       console.log("✅ User is checked in");
//       return res.json({
//         isCheckedIn: true,
//         checkInTime: activeSession.checkInTime,
//         attendanceId: activeSession._id
//       });
//     }
    
//     console.log("ℹ️ User is not checked in");
//     return res.json({ isCheckedIn: false });
    
//   } catch (error) {
//     console.error('❌ Error checking session status:', error);
//     res.status(500).json({ msg: 'Server error checking status' });
//   }
// });

// // GET /api/attendance/all - Fetch all attendance records
// router.get('/all', userAuth, async (req, res) => {
//   console.log("📋 Fetching all attendance records");
  
//   try {
//     const attendanceRecords = await Attendance.find({})
//       .populate('userId', 'name email')
//       .sort({ checkInTime: -1 })
//       .limit(100); 

//     if (!attendanceRecords || attendanceRecords.length === 0) {
//       return res.json([]); 
//     }

//     const formattedRecords = attendanceRecords.map(record => ({
//       id: record._id, 
//       _id: record._id, 
//       employeeName: record.userId?.name || 'Unknown',
//       employeeEmail: record.userId?.email || 'N/A',
//       date: record.checkInTime,
//       checkIn: record.checkInTime,
//       checkOut: record.checkOutTime,
//       taskDescription: record.taskDescription,
//       duration: record.checkOutTime 
//         ? Math.floor((new Date(record.checkOutTime) - new Date(record.checkInTime)) / 1000)
//         : null
//     }));

//     console.log(`✅ Found ${formattedRecords.length} records`);
//     res.json(formattedRecords);

//   } catch (error) {
//     console.error('❌ Error fetching attendance records:', error);
//     res.status(500).json({ msg: 'Server error fetching attendance' });
//   }
// });

// // DELETE single attendance record
// router.delete('/deleterec/:id', userAuth, adminAuth, async (req, res) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ message: 'Invalid ID format' });
//   }

//   try {
//     const result = await Attendance.findByIdAndDelete(id);

//     if (!result) {
//       return res.status(404).json({ message: 'Attendance record not found' });
//     }

//     res.status(200).json({ 
//       message: 'Record deleted successfully', 
//       deletedRecord: result 
//     });
//   } catch (error) {
//     console.error('Error deleting attendance record:', error);
//     res.status(500).json({ message: 'Server error during deletion' });
//   }
// });

// // DELETE multiple attendance records
// router.delete('/bulkdelete', userAuth, adminAuth, async (req, res) => {
//   const { ids } = req.body; 

//   if (!ids || !Array.isArray(ids) || ids.length === 0) {
//     return res.status(400).json({ message: 'Must provide a non-empty array of IDs' });
//   }
  
//   const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
//   const objectIds = validIds.map(id => new mongoose.Types.ObjectId(id));

//   try {
//     const result = await Attendance.deleteMany({
//       _id: { $in: objectIds }
//     });

//     res.status(200).json({
//       message: `${result.deletedCount} records deleted successfully.`,
//       deletedCount: result.deletedCount,
//       totalAttempted: ids.length,
//     });
//   } catch (error) {
//     console.error('Error during bulk deletion:', error);
//     res.status(500).json({ message: 'Server error during bulk deletion' });
//   }
// });

// export default router;

// ============================================
// FILE 3: Updated Frontend Component
// ============================================
// (Minimal changes to your existing frontend)

/* 
In your EmployeeDashboard.jsx, update the API_BASE to match your actual backend URL:

const API_BASE = 'https://skite-crm.onrender.com/api';  // Make sure this matches your backend!

Also add this debug log right after getting the user:

console.log("🔍 Auth Debug:", {
  EMPLOYEE_ID,
  EMPLOYEE_NAME,
  token: token ? `${token.substring(0, 20)}...` : 'MISSING',
  tokenLength: token?.length
});
*/