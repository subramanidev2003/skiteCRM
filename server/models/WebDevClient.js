import mongoose from 'mongoose';

const WebDevClientSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  businessName: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  // Project Level Status
  clientStatus: { type: String, default: 'Pending' }, // e.g., Onboarding, Active
  projectStatus: { type: String, default: 'Pending' }, // e.g., In Progress, Completed
  assignedDev: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Single assigned dev
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WebDevClient', WebDevClientSchema);