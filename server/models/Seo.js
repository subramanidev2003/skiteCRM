import mongoose from 'mongoose';

const SEOTaskSchema = new mongoose.Schema({
  clientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'SEOClient', required: true },
  type:           { type: String, enum: ['SEO Task', 'Report'], required: true }, // ✅ Requirement/Change → SEO Task/Report
  description:    { type: String, required: true },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  createdAt:      { type: Date, default: Date.now }
});

export default mongoose.model('SEOTask', SEOTaskSchema);