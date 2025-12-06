// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import skitelogo from '../assets/skitelogo.png';
// import './Login.css'; 
// import { toast } from "react-toastify";

// const AdminLogin = () => {
//     const navigate = useNavigate();
//     const [formData, setFormData] = useState({ email: "", password: "" });
//     const [loading, setLoading] = useState(false);

//     const handleInputChange = (e) => {
//         setFormData({
//             ...formData,
//             [e.target.name]: e.target.value,
//         });
//     };

//     const handleAdminLogin = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const res = await fetch("http://localhost:4000/api/auth/login", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(formData),
//             });

//             const data = await res.json();
//             setLoading(false);

//             // ❌ Backend login failed
//             if (!res.ok) {
//                 toast.error(data.message || "Login failed");
//                 return;
//             }

//             // ✅ FIX: Check if user is NOT Admin (changed from user.role to data.user.role)
//             if (data.user?.role?.toLowerCase() !== 'admin') {
//                 toast.error("Access denied: Admins only.");
//                 return;
//             }

//             // ✅ Save token AND user data
//             localStorage.setItem("token", data.token);
//             localStorage.setItem("user", JSON.stringify(data.user)); // ← Add this line!

//             toast.success("Admin login success!");

//             // Redirect admin only
//             navigate("/admin-dashboard");

//         } catch (err) {
//             console.error(err);
//             setLoading(false);
//             toast.error("Network error. Try again.");
//         }
//     };

//     return (
//         <div className="login-page">
//             <div className="login-card">
//                 <img src={skitelogo} alt="Skite Logo" className="login-logo" />
//                 <h2 className="login-title">Admin Login</h2>

//                 <form onSubmit={handleAdminLogin}>
//                     <div className="form-group">
//                         <label htmlFor="email">Admin Email</label>
//                         <input
//                             type="email"
//                             name="email"
//                             value={formData.email}
//                             onChange={handleInputChange}
//                             className="form-input"
//                             required
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label htmlFor="password">Admin Password</label>
//                         <input
//                             type="password"
//                             name="password"
//                             value={formData.password}
//                             onChange={handleInputChange}
//                             className="form-input"
//                             required
//                         />
//                     </div>

//                     <button type="submit" className="login-button" disabled={loading}>
//                         {loading ? "Logging In..." : "Admin Login"}
//                     </button>
//                 </form>

//                 <p className="register-link">
//                     Go to user login?{" "}
//                     <span onClick={() => navigate("/")}>Click Here</span>
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default AdminLogin;