// import express from 'express';
// import cookieparser from 'cookie-parser';
// import cors from 'cors';
// import 'dotenv/config';
// import connectDB from './config/mongodb.js';
// import authRouter from './routes/authRoutes.js';
// import userRouter from './routes/userRoutes.js';
// import attendanceRoutes from './routes/attendanceRoutes.js';
// import taskRouter from "./routes/taskRoutes.js";

// const app = express();
// const PORT = process.env.PORT || 4000;

// connectDB();

// app.use(express.json());
// app.use(cookieparser());
// app.use(cors({
//   origin: ['http://localhost:5173', 'https://skitecrm.onrender.com'],
//   credentials: true
// }));

// app.get('/', (req, res) => {
//   res.json({ message: 'API is working!', version: '1.0.0' });
// });

// app.use('/api/auth', authRouter); 
// app.use('/api/user', userRouter); 
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/tasks', taskRouter);


// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   // console.log(`🎯 Product API: http://localhost:${PORT}/api/product-price`);
// });
import express from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRouter from "./routes/taskRoutes.js";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import leadRoutes from './routes/leadRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import socialMediaRoutes from './routes/socialMediaRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import webDevRoutes from './routes/webdevRoutes.js';
import leaveRoutes from './routes/leavesRoutes.js';
import receiptRoutes from "./routes/receiptRoutes.js";
import seoRoutes from './routes/seoRoutes.js';

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Connect to Database
connectDB(); 

// ES modules workaround for directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Create Uploads Directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 3. CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://crm.skitedigital.in",
  "https://skitecrm.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 4. Global Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

// 5. Serve Static Files
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API is working!', version: '1.0.0' });
});

// 7. ✅ ALL API ROUTES (Ellaamae munnadi irukkanum)
app.use('/api/auth', authRouter); 
app.use('/api/user', userRouter); 
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRouter);
app.use('/api/leads', leadRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/quote', quoteRoutes); 
app.use('/api/transaction', transactionRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/webdev', webDevRoutes);
app.use('/api/leaves', leaveRoutes);
app.use("/api/receipt", receiptRoutes);
app.use('/api/seo', seoRoutes);

// 8. ❌ 404 HANDLER (Ithu thaan KADAISIYA irukkanum)
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.originalUrl}` 
  });
});

// 9. ERROR HANDLING MIDDLEWARE (Last fallback)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 10. START SERVER
app.listen(PORT, () => {
  console.log('🚀 Server is running');
  console.log(`📍 Port: ${PORT}`);
});

// Handle Rejections/Exceptions
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  if (process.env.NODE_ENV === 'development') process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});