import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  salesAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
    // ref: 'User' (Removed to allow Admin ID)
  },
  date: { type: String, required: true },
  name: { type: String, required: true },
  companyName: { type: String },
  business: { type: String },
  location: { type: String },
  phoneNumber: { type: String, required: true },
  serviceType: { 
    type: String, 
    default: 'Web Development',
    enum: ['Web Development', 'SEO', 'Paid Campaigns', 'Personal Branding', 'Full Digital Marketing']
  },
  priority: { 
    type: String, 
    default: 'Medium',
    enum: ['High', 'Medium', 'Low'] 
  },
  requirement: { type: String },
  
  // ✅ UPDATED: Added 'Callback' option
  callStatus: { 
    type: String, 
    default: 'Not Attend',
    enum: ['Attend', 'Not Attend', 'Callback']
  },
  
  followUpStatus: { 
    type: String, 
    default: 'No',
    enum: ['Yes', 'No']
  },
  
  callbackDate: { type: String },

  // ✅ FIXED: Added default 'Not' so it is never empty
  leadStatus: { 
    type: String, 
    default: 'Not', 
    enum: ['Okay', 'Not'] 
  },

  payment: { type: String },
  
  closing: { 
    type: String, 
    default: 'No',
    enum: ['Yes', 'No']
  }
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);