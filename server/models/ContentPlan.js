import mongoose from 'mongoose';

const ContentPlanSchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  
  type: { type: String, required: true }, // 'Shoot', 'Edit', 'Post'
  
  // Common Fields
  scriptTitle: { type: String }, // Used as 'Title' or 'Caption Topic'

  // --- SHOOT FIELDS ---
  shootDate: { type: Date },
  shootDetails: { type: String },
  shootStatus: { type: String, default: 'Pending' }, 

  // --- EDIT FIELDS (New) ---
  editDate: { type: Date }, // Deadline
  editDetails: { type: String },
  editStatus: { type: String, default: 'Pending' },

  // --- POST FIELDS (New) ---
  postDate: { type: Date },
  caption: { type: String },
  postStatus: { type: String, default: 'Pending' },

  // Link to Task (Automation)
  assignedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, 
  assignedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ContentPlan', ContentPlanSchema);