import mongoose from 'mongoose';

const ContentPlanSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  
  // Type: 'Shoot', 'Script', 'Edit', 'Post'
  type: { type: String, required: true }, 

  // Common Details
  date: { type: Date, required: true },
  startTime: { type: String }, // e.g., "10:00"
  endTime: { type: String },   // e.g., "12:00"
  details: { type: String },   // Description

  // Status (Manual Dropdown in Table)
  status: { type: String, default: 'Pending' }, // Pending / Completed

  // Task Automation Links
  assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  assignedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ContentPlan', ContentPlanSchema);