import express from 'express';
import Lead from '../models/Lead.js'; // ஃபைல் பெயர் சரியாக இருக்கிறதா என்று பார்த்துக்கொள்ளுங்கள்

const router = express.Router();

// 1. ADD NEW LEAD (POST)
router.post('/add', async (req, res) => {
    try {
        const { 
            date, name, email, companyName, business, location, phoneNumber, 
            serviceType, priority, requirement, callStatus, followUpStatus, 
            callbackDate, leadStatus, payment, closing, salesAgentId 
        } = req.body;

        // ✅ Check if salesAgentId is provided
        if (!salesAgentId) {
            return res.status(400).json({ message: "Sales Agent ID (or Admin ID) is required" });
        }

        const newLead = new Lead({
            date, name, 
            email, // ✅ Email இங்கேயும் சரியாக உள்ளது
            companyName, business, location, phoneNumber, 
            serviceType, priority, requirement, callStatus, followUpStatus, 
            callbackDate, leadStatus, payment, closing, 
            salesAgentId
        });

        await newLead.save();
        res.status(201).json({ message: "Lead added successfully", lead: newLead });

    } catch (error) {
        console.error("Error adding lead:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 2. GET ALL LEADS FOR A SPECIFIC USER (GET)
router.get('/all/:userId', async (req, res) => {
  try {
    const leads = await Lead.find({ salesAgentId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// 3. UPDATE LEAD (PUT)
// 3. UPDATE LEAD (PUT)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ { runValidators: true } சேர்த்தால் தவறான status/priority வராது
    const updatedLead = await Lead.findByIdAndUpdate(
        id, 
        req.body, 
        { new: true, runValidators: true } 
    );

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json({ success: true, message: 'Lead updated', lead: updatedLead });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// 4. GET ALL LEADS FOR ADMIN (GET)
router.get('/admin/all', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leads' });
  }
});

// 5. DELETE LEAD (DELETE)
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Lead.findByIdAndDelete(id);
    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lead" });
  }
});

export default router;