import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();

// Connect to MongoDB - Vercel will run this on every function call
connectDB(); 

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS settings
// **MUST REPLACE THIS PLACEHOLDER with your actual Vercel URL**
const allowedOrigins = ["https://your-vercel-app-name.vercel.app","http://localhost:5174", "http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static uploads (Note: Vercel serverless functions have limited file storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRouter); 
app.use('/api/user', userRouter); 
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tasks', taskRouter);

// API root
app.get('/api', (req, res) => {
  res.send('API is working');
});


// ----------------------------------------------------------------------------------
// ** VERCEL MODIFICATION REQUIRED HERE **
// ----------------------------------------------------------------------------------

// 1. DELETE/COMMENT OUT the entire app.listen block, as Vercel handles the server start:
/*
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
*/

// 2. Add the module export line at the bottom. This is how Vercel gets the Express app.
export default app;
