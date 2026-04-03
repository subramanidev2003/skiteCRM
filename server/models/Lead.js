import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  salesAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  date: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: false },
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
  
  callStatus: { 
    type: String, 
    default: 'Not Attend',
    enum: ['Attend', 'Not Attend', 'Callback']
  },

  // --- REMAINDER 2 SECTION UPDATED ---
  remainder2: { 
    type: String, 
    default: "" 
  },
  // ✅ NEW: Remainder 2 Date (Date Picker storage)
  remainder2Date: { 
    type: String, 
    default: "" 
  },
  // ✅ NEW: Remainder 2 Action Status
  remainder2Status: { 
    type: String, 
    enum: ['Pending', 'Completed', ''], 
    default: 'Pending' 
  },

  followUpResponsibility: { 
    type: String, 
    enum: ['teleSales', 'sasi prakash', ''], 
    default: "" 
  },
  
  website: { type: String },
  orderStatus: { type: String, default: 'Open' },
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