// server/models/Attendance.js
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // ✅ Search filter correct-ah work aaga intha field venum
    employeeName: {
        type: String,
        default: '',
    },
    // ✅ Display panna intha field venum
    designation: {
        type: String,
        default: '',
    },
    // ✅ Frontend date filter-ku ithu helpful-ah irukkum
    date: {
        type: Date,
        default: Date.now
    },
    checkInTime: {
        type: Date,
        required: true,
    },
    checkOutTime: {
        type: Date,
        default: null, 
    },
    taskDescription: {
        type: String,
        default: '',
    },
    // ✅ Ithu thaan "Casual Leave"-ah identify panna logic!
    isCL: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        // ✅ Status-la 'Present' enum sethukkonga (CL approval-ku ithu thaan set panrom)
        enum: ['Checked In', 'Checked Out', 'Present'], 
        default: 'Checked In',
    },
}, { timestamps: true });

export default mongoose.model('Attendance', AttendanceSchema);