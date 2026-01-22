// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//     // --- Basic & Professional Details ---
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, default: "employee" }, // ✅ CHANGED from "Web Developer" to "employee"
//     designation: { type: String, default: "Web Developer" }, // ✅ ADDED: Separate field for job title
//     dob: { type: Date, required: true },
//     image: { type: String, default: "" },
    
//     // --- Professional Details ---
//     joiningDate: { type: Date, required: true },

//     // --- Identification Details ---
//     panNumber: { type: String, required: true, unique: true, maxlength: 10 }, 
//     aadharNumber: { type: String, required: true, unique: true, maxlength: 12 }, 
    
//     // --- Bank Details (Nested) ---
//     bankDetails: {
//         bankName: { type: String, required: true },
//         accountNumber: { type: String, required: true },
//         ifscCode: { type: String, required: true },
//     }
// }, { timestamps: true });

// const userModel = mongoose.models.User 
//     ? mongoose.models.User 
//     : mongoose.model("User", userSchema); 

// export default userModel;





import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // REQUIRED FIELDS
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // OPTIONAL FIELDS (can be added later via edit)
  role: {
    type: String,
    enum: ['Admin', 'employee', 'Manager', 'Sales', 'Accountant'], // Added 'Accountant' role
    default: 'employee'
  },
  designation: {
    type: String,
    default: ''
  },
  dob: {
    type: Date,
    required: false
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  panNumber: {
    type: String,
    default: '',
    uppercase: true
  },
  aadharNumber: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  salaryPerDay: { 
    type: Number, 
    default: 0 
  },
  
  // Bank Details - All Optional
  bankDetails: {
    bankName: {
      type: String,
      default: ''
    },
    accountNumber: {
      type: String,
      default: ''
    },
    ifscCode: {
      type: String,
      default: '',
      uppercase: true
    }
  }
}, { 
  timestamps: true 
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;