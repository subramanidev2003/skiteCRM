// server/models/Attendance.js
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    checkInTime: {
        type: Date,
        required: true,
    },
    checkOutTime: {
        type: Date,
        default: null, // Null indicates the user is still checked in
    },
    taskDescription: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['Checked In', 'Checked Out'],
        default: 'Checked In',
    },
}, { timestamps: true });

export default mongoose.model('Attendance', AttendanceSchema);