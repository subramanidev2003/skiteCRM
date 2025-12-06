// src/middleware/multerConfig.js

import multer from 'multer';
import path from 'path'; // Used for managing file paths

// 1. Define storage settings
const storage = multer.diskStorage({
    // Sets the destination folder for the uploaded files
    destination: (req, file, cb) => {
        // 'uploads/' is the directory where images will be saved.
        // Make sure this folder exists in your server's root.
        cb(null, 'uploads/'); 
    },
    // Sets the file name to prevent naming conflicts
    filename: (req, file, cb) => {
        // Create a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// 2. Define file filtering (optional but recommended)
const fileFilter = (req, file, cb) => {
    // Check if the file MIME type starts with 'image/'
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Only image files are allowed!'), false); // Reject the file
    }
};

// 3. Initialize multer with the configuration
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
    }
});

// 4. Export the configured upload middleware
export default upload;