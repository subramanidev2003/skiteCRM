import express from 'express';
import Lead from '../models/Lead.js'; // Ensure this path is correct

const router = express.Router();

// 1. ADD NEW LEAD
// server/routes/leadRoutes.js

router.post('/add', async (req, res) => {
    try {
        const { 
            date, name, companyName, business, location, phoneNumber, 
            serviceType, priority, requirement, callStatus, followUpStatus, 
            callbackDate, leadStatus, payment, closing, salesAgentId 
        } = req.body;

        // ✅ Check if salesAgentId is provided
        if (!salesAgentId) {
            return res.status(400).json({ message: "Sales Agent ID (or Admin ID) is required" });
        }

        const newLead = new Lead({
            date, name, companyName, business, location, phoneNumber, 
            serviceType, priority, requirement, callStatus, followUpStatus, 
            callbackDate, leadStatus, payment, closing, 
            salesAgentId // ✅ Just save the ID directly
        });

        await newLead.save();
        res.status(201).json({ message: "Lead added successfully", lead: newLead });

    } catch (error) {
        console.error("Error adding lead:", error); // ✅ Log error to terminal to see details
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 2. GET ALL LEADS FOR USER
router.get('/all/:userId', async (req, res) => {
  try {
    const leads = await Lead.find({ salesAgentId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// ✅ THIS IS THE CRITICAL LINE THAT WAS MISSING OR WRONG
// ... inside server/routes/leadRoutes.js

// 3. UPDATE LEAD (PUT /api/leads/update/:id)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLead = await Lead.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.status(200).json({ success: true, message: 'Lead updated', lead: updatedLead });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});
router.get('/admin/all', async (req, res) => {
  try {
    // Fetch all leads from the database, sorted by newest
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leads' });
  }
});
router.get('/common/all', async (req, res) => {
  try {
    // Fetch all leads, sorted by newest first
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});
// server/routes/leadRoutes.js

// ✅ Delete Lead Route
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