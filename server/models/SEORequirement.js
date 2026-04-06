import mongoose from 'mongoose';

const SEORequirementSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'SEOClient', required: true },
    type: { type: String, enum: ['Requirement', 'Change'], required: true },
    description: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, // மெயின் டாஸ்க் சிஸ்டம் கூட லிங்க் பண்றோம்
    createdAt: { type: Date, default: Date.now }
});

const SEORequirement = mongoose.model('SEORequirement', SEORequirementSchema);
export default SEORequirement; // ✅ Export changed to ES Module