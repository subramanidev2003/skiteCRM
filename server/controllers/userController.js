import mongoose from 'mongoose';
import userModel from '../models/userModel.js'; // Ensure path is correct
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// 1. GET LOGGED-IN USER DATA
// ================================
export const getUserdata = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Missing user ID" });
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        const user = await userModel.findById(userId).select('-password -__v'); 
        
        if (!user) {
            return res.status(404).json({ message: "User record not found" }); 
        }
        
        return res.status(200).json({ user });
        
    } catch (error) {
        console.error("Get User Data Error:", error); 
        return res.status(500).json({ message: "Server error" });
    }
};

// ================================
// 2. GET ALL EMPLOYEES
// ================================
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await userModel
            .find({ role: { $ne: "Admin" } }) 
            .select('name role email designation dob image joiningDate salaryPerDay _id') 
            .sort({ name: 1 });

        return res.status(200).json(employees);

    } catch (error) {
        console.error("Error fetching employees:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ================================
// 3. GET SINGLE EMPLOYEE DETAILS
// ================================
export const getEmployeeDetails = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid employee ID format" });
        }

        const user = await userModel.findById(userId).select('-password -__v');

        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Get Employee Details Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ================================
// 4. DELETE EMPLOYEE
// ================================
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const deletedUser = await userModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (deletedUser.image) {
            const imagePath = path.join(process.cwd(), 'uploads', deletedUser.image);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (error) {
                    console.error('Error deleting image:', error);
                }
            }
        }

        return res.status(200).json({ 
            message: "Employee deleted successfully",
            deletedUser: { id: deletedUser._id, name: deletedUser.name }
        });

    } catch (error) {
        console.error("Delete Employee Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ================================
// 5. UPDATE EMPLOYEE - ✅ FIXED LOGIC
// ================================
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // 🔴 DEBUGGING: Check what frontend is sending
        console.log("--------------------------------");
        console.log(`Updating User ID: ${id}`);
        console.log("Req Body:", req.body);
        console.log("Salary Received:", req.body.salaryPerDay);
        console.log("--------------------------------");

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid employee ID format" });
        }

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Prepare Updates Object
        let updates = {
            name: req.body.name || user.name,
            email: req.body.email || user.email,
            designation: req.body.designation || user.designation,
            role: req.body.role || user.role,
            panNumber: req.body.panNumber || user.panNumber,
            aadharNumber: req.body.aadharNumber || user.aadharNumber,
            dob: req.body.dob || user.dob,
            joiningDate: req.body.joiningDate || user.joiningDate,
        };

        // ✅ FIXED SALARY LOGIC
        // Check if salaryPerDay is NOT undefined and NOT an empty string
        if (req.body.salaryPerDay !== undefined && req.body.salaryPerDay !== "") {
            updates.salaryPerDay = Number(req.body.salaryPerDay);
        } else {
            updates.salaryPerDay = user.salaryPerDay;
        }

        // 2. Handle Password
        if (req.body.password && req.body.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        // 3. Handle Bank Details
        if (req.body.bankDetails) {
            try {
                // If sent as stringified JSON (common in FormData)
                updates.bankDetails = typeof req.body.bankDetails === 'string' 
                    ? JSON.parse(req.body.bankDetails) 
                    : req.body.bankDetails;
            } catch (error) {
                console.error("Bank details parsing error:", error);
                // Keep old bank details if parsing fails
                updates.bankDetails = user.bankDetails;
            }
        }

        // 4. Handle Image Upload
        if (req.file) {
            // Delete old image if exists
            if (user.image) {
                const oldPath = path.join(process.cwd(), 'uploads', user.image);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.error('Failed to delete old image:', err);
                    }
                }
            }
            updates.image = req.file.filename;
        } 
        else if (req.body.image === "") {
             // Handle explicit image removal if needed, otherwise keep existing
             // updates.image = ""; 
        }

        // 5. Update Database
        const updatedUser = await userModel.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        ).select('-password');

        console.log("✅ Updated User Salary:", updatedUser.salaryPerDay);

        return res.status(200).json({ 
            message: 'Employee updated successfully', 
            user: updatedUser 
        });

    } catch (error) {
        console.error('Update Employee Error:', error);
        return res.status(500).json({ message: 'Server error while updating' });
    }
};