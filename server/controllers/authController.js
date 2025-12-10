// src/controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
// Example of a correct ES Module import

// ================================
// 1. REGISTER EMPLOYEE
// ================================
// ================================
// 1. REGISTER EMPLOYEE
// ================================
// ================================
// 1. REGISTER EMPLOYEE (FIXED)
// ================================
export const registerEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      designation,
      dob,
      joiningDate,
      panNumber,
      aadharNumber,
      bankName,
      accountNumber,
      ifscCode
    } = req.body;

    console.log('📝 Registration Request Body:', req.body);
    console.log('📷 Uploaded File:', req.file);

    // ✅ FIXED: Changed User to userModel
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // ✅ Get uploaded image filename
    const image = req.file ? req.file.filename : '';

    // ✅ FIXED: Changed User to userModel
    const newUser = new userModel({
      name,
      email,
      password, // Will be hashed by the model's pre-save hook
      role: role || 'employee',
      designation,
      dob,
      joiningDate,
      panNumber,
      aadharNumber,
      bankName,
      accountNumber,
      ifscCode,
      image // ✅ Save the image filename
    });

    await newUser.save();

    console.log('✅ User created successfully:', newUser._id);

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        image: newUser.image
      }
    });

  } catch (error) {
    console.error('❌ Registration Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};
// ================================
// 2. LOGIN EMPLOYEE
// ================================
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const user = await userModel.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,              // ✅ This will now be "employee" or "Admin"
                designation: user.designation, // ✅ ADDED: Job title like "Web Developer"
                dob: user.dob,
                image: user.image,
            },
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


// ================================
// 3. LOGOUT EMPLOYEE
// ================================
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


// ================================
// 4. ADMIN LOGIN
// ================================
// ================================
// 4. ADMIN LOGIN (MODIFIED)
// ================================
export const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // ... (validation and user finding logic is correct)

        const token = jwt.sign(
            { id: admin._id, role: "Admin" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ FIX: Use a unique cookie name 'adminToken'
        res.cookie("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // ✅ IMPORTANT: Do NOT return the token in the body for the admin.
        // The client must now retrieve the token from the cookie headers in subsequent requests.
        return res.status(200).json({
            message: "Admin login successful",
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                // Add any necessary admin user details
            },
        });

    } catch (error) {
        console.error("Admin Login Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
// ================================
// 7. LOGOUT ADMIN (NEW)
// ================================
export const adminLogout = async (req, res) => {
    try {
        // ✅ FIX: Clear ONLY the unique 'adminToken' cookie
        res.clearCookie("adminToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        return res.status(200).json({ message: "Admin logout successful" });
    } catch (error) {
        console.error("Admin Logout Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ================================
// 5. REGISTER ADMIN
// ================================
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const old = await userModel.findOne({ email });
        if (old) return res.status(400).json({ message: "Email already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            name,
            email,
            password: hashed,
            role: "Admin",
        });

        return res.json({
            message: "Admin registered successfully",
            user,
        });

    } catch (error) {
        console.error("Admin Register Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


// ================================
// 6. GET LOGGED-IN USER (EMPLOYEE/ADMIN)
// ================================
export const getLoggedUser = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select("-password");

        return res.json(user);

    } catch (error) {
        console.error("Get User Error:", error);
        return res.status(401).json({ message: "Invalid token" });
    }
};
