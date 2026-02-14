import express from 'express';
import SocialMediaClient from '../models/SocialMediaClient.js';

const router = express.Router();

// 1. ADD NEW CLIENT
router.post('/add', async (req, res) => {
  try {
    const { clientName, businessName, month } = req.body;
    
    // Create empty days for the logic (handled in frontend usually, but init here is fine)
    const newClient = new SocialMediaClient({ clientName, businessName, month, days: [] });
    await newClient.save();
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL CLIENTS
router.get('/all', async (req, res) => {
  try {
    const clients = await SocialMediaClient.find().sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET SINGLE CLIENT
// ✅ GET SINGLE CLIENT BY ID
router.get('/:id', async (req, res) => {
  try {
    const client = await SocialMediaClient.findById(req.params.id); // ✅ findById முக்கியம்
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE DAY STATUS & PAYMENT
// 4. UPDATE DAY STATUS, PAYMENT & MERGE DAYS (Backend Fix)
router.put('/update/:id', async (req, res) => {
  try {
    // ✅ 1. videoTarget-ையும் சேர்த்து எடுக்கிறோம்
    const { days, paymentStatus, currentMonth, videoTarget } = req.body;
    
    // Client இருக்கிறதா என சரிபார்க்கிறோம்
    const client = await SocialMediaClient.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    // ✅ 2. Days Merging Logic (மிக முக்கியம்!)
    // பழைய டேட்டாவை அழியாமல் பார்த்துக்கொள்ள Map பயன்படுத்துகிறோம்
    const existingDaysMap = new Map(client.days.map(d => [d.date, d]));

    // புதிய டேட்டாவை பழைய டேட்டாவுடன் இணைக்கிறோம்
    if (days && Array.isArray(days)) {
        days.forEach(newDay => {
            // தேதி இருந்தால் அப்டேட் செய்யும், இல்லை என்றால் புதிதாக சேர்க்கும்
            existingDaysMap.set(newDay.date, newDay);
        });
    }

    // Map-ஐ மீண்டும் Array ஆக மாற்றுகிறோம்
    client.days = Array.from(existingDaysMap.values());

    // 3. Payment Status Update
    if (paymentStatus) client.paymentStatus = paymentStatus;

    // 4. Update Current Active Month (வெளியே Card-ல் காட்ட)
    if (currentMonth) client.month = currentMonth;

    // ✅ 5. VIDEO TARGET UPDATE (இதுதான் புதிதாகச் சேர்த்தது)
    // 0 கூட ஒரு டார்கெட் என்பதால் !== undefined என்று பார்க்கிறோம்
    if (videoTarget !== undefined) {
        client.videoTarget = videoTarget;
    }

    await client.save();
    res.status(200).json(client);

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;