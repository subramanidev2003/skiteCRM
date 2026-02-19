import express from 'express';
import Lead from '../models/Lead.js'; 

const router = express.Router();

// 1. ADD NEW LEAD (POST)
router.post('/add', async (req, res) => {
    try {
        const { 
            date, name, email, companyName, business, location, phoneNumber, 
            serviceType, priority, requirement, callStatus, followUpStatus, 
            callbackDate, leadStatus, payment, closing, salesAgentId 
        } = req.body;

        if (!salesAgentId) {
            return res.status(400).json({ message: "Sales Agent ID (or Admin ID) is required" });
        }

        const newLead = new Lead({
            date, name, email, companyName, business, location, phoneNumber, 
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

// ✅ 2. GET ALL LEADS (COMMON ACCESS) - இது தான் விடுபட்டிருந்தது!
router.get('/common/all', async (req, res) => {
  try {
    // Fetch all leads, sorted by newest first
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// 3. GET ALL LEADS FOR A SPECIFIC USER (GET)
router.get('/all/:userId', async (req, res) => {
  try {
    const leads = await Lead.find({ salesAgentId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

// 4. UPDATE LEAD (PUT)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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

// 5. GET ALL LEADS FOR ADMIN (GET)
router.get('/admin/all', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all leads' });
  }
});

// 6. DELETE LEAD (DELETE)
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Lead.findByIdAndDelete(id);
    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lead" });
  }
});
// --- BULK IMPORT LEADS ---
// --- BULK IMPORT LEADS ---
router.post('/import', async (req, res) => {
  try {
    const { leads, salesAgentId } = req.body; 

    // 1. Array சரியாக வருகிறதா என்று செக் செய்கிறோம்
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "No leads data found" });
    }

    // 2. ✅ Agent ID வருகிறதா என்று உறுதியாக செக் செய்கிறோம்
    if (!salesAgentId) {
        return res.status(400).json({ message: "Sales Agent ID is missing! Cannot save leads." });
    }

    // 3. டேட்டாவை தயார் செய்கிறோம்
    const leadsWithAgent = leads.map(lead => ({
      ...lead,
      salesAgentId: lead.salesAgentId || salesAgentId, // Frontend-ல் இருந்து வந்தாலும் சரி, தனியாக வந்தாலும் சரி
      date: lead.date || new Date()
    }));

    // 4. Database-ல் Save செய்கிறோம்
    const insertedLeads = await Lead.insertMany(leadsWithAgent);

    res.status(201).json({ message: "Leads Imported Successfully", count: insertedLeads.length, leads: insertedLeads });
  } catch (err) {
    // 5. Mongoose Duplicate Key Error (E11000) வந்தால் தெளிவாக சொல்லும்
    if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate Phone Number or Email found in Excel!", error: err.message });
    }
    res.status(500).json({ message: "Error importing leads", error: err.message });
  }
});
export default router;