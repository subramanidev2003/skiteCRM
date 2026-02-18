import mongoose from 'mongoose';

const LeaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  designation: { type: String },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Export Default
export default mongoose.model('Leave', LeaveSchema);