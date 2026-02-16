import mongoose from 'mongoose';

const WebDevClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  businessName: { type: String },
  phone: { type: String },
  email: { type: String },
  
  // Project Level Status
  clientStatus: { type: String, default: 'Pending' }, // e.g., Onboarding, Active
  projectStatus: { type: String, default: 'Pending' }, // e.g., In Progress, Completed
  
  assignedDevelopers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of assigned devs
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WebDevClient', WebDevClientSchema);