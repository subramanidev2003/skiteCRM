import userModel from "../models/userModel.js";
import Attendance from "../models/Attendance.js"; // Ensure this path is correct

// --- 1. CHECK IN (Renamed to match your routes file) ---
export const checkin = async (req, res) => { // Exported as checkin (lowercase 'i')
  const { userId } = req.body; 

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if the user is already checked in (find an open session)
    const activeSession = await Attendance.findOne({
        userId: userId,
        checkOutTime: null
    });

    if (activeSession) {
        return res.status(400).json({ msg: "User is already checked in." });
    }

    // Create Attendance Record
    const newAttendance = new Attendance({
      userId: user._id,
      checkInTime: new Date(),
      status: "Checked In"
    });

    await newAttendance.save();
    res.status(200).json(newAttendance);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
};

// --- 2. CHECK OUT (Needed for the route file) ---
export const checkout = async (req, res) => {
    const { userId, taskDescription } = req.body;
    
    try {
        const session = await Attendance.findOneAndUpdate(
            { userId: userId, checkOutTime: null }, // Find the active session
            { 
                checkOutTime: new Date(),
                taskDescription: taskDescription,
                status: "Checked Out"
            },
            { new: true } // Return the updated document
        );

        if (!session) {
            return res.status(404).json({ msg: "No active check-in session found." });
        }

        res.status(200).json(session);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server Error during checkout" });
    }
};



// server/controllers/attendanceController.js

// export const getAttendanceStatus = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Find the latest attendance record for this user
//     const lastRecord = await Attendance.findOne({ employeeId: userId })
//       .sort({ createdAt: -1 }); // Get the most recent one

//     // If no record exists, or the last record has an 'outTime', they are NOT checked in.
//     if (!lastRecord || lastRecord.outTime) {
//       return res.status(200).json({ isCheckedIn: false, lastRecord: null });
//     }

//     // If there is a record and outTime is null, they ARE checked in.
//     return res.status(200).json({ 
//       isCheckedIn: true, 
//       lastRecord: lastRecord 
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error fetching status" });
//   }
// };