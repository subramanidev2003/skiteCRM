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



const app = express();
const PORT = process.env.PORT || 8080; // Idhu mattum irukkatum

// Connect to Database
connectDB(); 

// Get directory path (ES modules workaround)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ CREATE UPLOADS DIRECTORY IF IT DOESN'T EXIST
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  // console.log('✅ Uploads directory created at:', uploadsDir);
} else {
  // console.log('✅ Uploads directory exists at:', uploadsDir);

}

// ✅ CORS CONFIGURATION - UPDATED WITH PRODUCTION URL
const allowedOrigins = [
  "http://localhost:5173",           // Local development
  "https://crm.skitedigital.in",     // Your production frontend
  "https://skitecrm.onrender.com"   // Your backend (for testing)
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ MIDDLEWARE
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieparser()); // Parse cookies

// ✅ SERVE STATIC FILES - Images accessible via /api/uploads/filename.jpg
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
// console.log('✅ Static files served from /api/uploads');

// ✅ ROOT ENDPOINT
app.get('/', (req, res) => {
  res.json({ 
    message: 'API is working!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      attendance: '/api/attendance',
      tasks: '/api/tasks',
      uploads: '/api/uploads'
    }
  });
});

// ✅ API ROUTES
app.use('/api/auth', authRouter); 
app.use('/api/user', userRouter); 
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRouter);
app.use('/api/leads', leadRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/quote', quoteRoutes); // Add this line
app.use('/api/transaction', transactionRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/content', contentRoutes);
// Web Development Routes
app.use('/api/webdev', webDevRoutes);
app.use('/api/leaves', leaveRoutes);
app.use("/api/receipt", receiptRoutes);

// ✅ ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});



// ✅ START SERVER
app.listen(PORT, () => {
  console.log('🚀 Server is running');
  console.log(`📍 Port: ${PORT}`);
  // console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  // console.log(`📁 Uploads Directory: ${uploadsDir}`);
  // console.log(`🔒 CORS Allowed Origins:`, allowedOrigins);
});

// ✅ HANDLE UNHANDLED REJECTIONS
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// ✅ HANDLE UNCAUGHT EXCEPTIONS
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});








































