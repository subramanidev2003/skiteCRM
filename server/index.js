// import express from 'express';
// import cookieparser from 'cookie-parser';
// import cors from 'cors';
// import 'dotenv/config';
// import connectDB from './config/mongodb.js';
// import authRouter from './routes/authRoutes.js';
// import userRouter from './routes/userRoutes.js';
// import attendanceRoutes from './routes/attendanceRoutes.js';
// import taskRouter from "./routes/taskRoutes.js";
// import { fileURLToPath } from 'url';
// import path from 'path';
// // import attendanceRoutes from './routes/attendanceRoutes.js';

// const app = express();
// const PORT = process.env.PORT || 4000;
// connectDB(); 
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const allowedOrigins = ["http://localhost:5174", "http://localhost:5173"];

// app.use(express.json()); // Parses JSON (for login, etc.)
// app.use(cookieparser());
// app.use(cors({
//   origin: allowedOrigins, // Your React app URL
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
// // --- NEW: Serve the 'uploads' folder statically so frontend can see images ---
// // Ensure you create a folder named 'uploads' in your server root directory
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // ---------------------------------------------------------------------------

// // API ENDPOINTS
// app.get('/', (req, res) => {
//   res.send('API working');
// });

// app.use('/api/auth', authRouter); 
// app.use('/api/user', userRouter); 
// app.use('/api/attendance', attendanceRoutes);
// app.use("/api/tasks", taskRouter);


// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });




// server/index.js
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
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB(); 

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS settings
const allowedOrigins = ["http://localhost:5174", "http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static uploads
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

// Serve React build **for all non-API routes**
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  } else {
    next();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
