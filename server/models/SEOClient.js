import mongoose from 'mongoose';

const SEOClientSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    businessName: { type: String, required: true },
    phone: String,
    email: String,
    website: String,
    assignedDev: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // SEO Specialist
    clientStatus: { 
        type: String, 
        enum: ['Pending', 'Onboarding', 'Active', 'Completed'], 
        default: 'Pending' 
    },
    projectStatus: { 
        type: String, 
        enum: ['Pending', 'In Progress', 'Testing', 'Completed'], 
        default: 'Pending' 
    },
    startDate: Date,
    endDate: Date,
    advancePaymentDate: Date,
    fullPaymentDate: Date,
    createdAt: { type: Date, default: Date.now }
});

const SEOClient = mongoose.model('SEOClient', SEOClientSchema);
export default SEOClient; // ✅ Export changed to ES Module