import mongoose from 'mongoose';

const SEOClientSchema = new mongoose.Schema({
  clientName:         { type: String, required: true },
  businessName:       { type: String },
  phone:              { type: String },
  email:              { type: String },
  website:            { type: String },
  targetKeywords:     { type: String },   // ✅ SEO specific
  clientStatus:       { type: String, default: 'Pending' },
  projectStatus:      { type: String, default: 'Pending' },
  assignedTo:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ assignedDev → assignedTo
  startDate:          { type: Date },
  endDate:            { type: Date },
  advancePaymentDate: { type: Date },
  fullPaymentDate:    { type: Date },
  createdAt:          { type: Date, default: Date.now }
});

export default mongoose.model('SEOClient', SEOClientSchema);