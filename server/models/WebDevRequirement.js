import mongoose from 'mongoose';

const WebDevRequirementSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebDevClient', required: true },
  type: { type: String, required: true }, // 'Requirement' or 'Change'
  description: { type: String, required: true },
  
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Employee ID
  assignedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // Linked Task ID
  
  status: { type: String, default: 'Pending' }, // Pending / Completed
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WebDevRequirement', WebDevRequirementSchema);