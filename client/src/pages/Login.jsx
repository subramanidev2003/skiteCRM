import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import skitelogo from '../assets/skitelogo.png'; 
import './Login.css';

// UPDATED: Pointing to Localhost as requested
const API_BASE = 'https://skitecrm.onrender.com/api';

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [status, setStatus] = useState({
        loading: false,
        error: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

const handleLogin = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '' });
        localStorage.clear(); 

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ loading: false, error: '' });
                const role = data.user.role.toLowerCase(); // Role check

                // --- ADMIN ---
                if (role === 'admin') {
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('userRole', 'admin'); // ✅ Role store panrom
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    setTimeout(() => navigate('/admin-dashboard', { replace: true }), 100);
                } 
                
                // --- ACCOUNTANT (NEW) ✅ ---
                else if (role === 'accountant') {
                    localStorage.setItem('accountantToken', data.token); // Accountant Token
                    localStorage.setItem('userRole', 'accountant'); // ✅ Role store panrom
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    
                    // Admin Dashboard-kku anupurom, aana anga filter pannuvom
                    setTimeout(() => navigate('/admin-dashboard', { replace: true }), 100);
                }

                // --- MANAGER ---
                else if (role === 'manager') {
                    localStorage.setItem('managerToken', data.token);
                    setTimeout(() => navigate('/manager-dashboard', { replace: true }), 100);
                }
                // --- SALES ---
                else if (role === 'sales') {
                    localStorage.setItem('salesToken', data.token);
                    setTimeout(() => navigate('/sales-dashboard', { replace: true }), 100);
                }
                // --- EMPLOYEE ---
                else if (role === 'employee') {
                    localStorage.setItem('employeeToken', data.token);
                    setTimeout(() => navigate('/employee-dashboard', { replace: true }), 100);
                } 
                else {
                    setStatus({ loading: false, error: 'Invalid role' });
                }

            } else {
                setStatus({ loading: false, error: data.message || 'Login failed' });
            }
        } catch (err) {
            setStatus({ loading: false, error: 'Server error' });
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <img src={skitelogo} alt="Skite Logo" className="login-logo" />
                <h2 className="login-title">Skite Login</h2>

                <form onSubmit={handleLogin}>

                    {status.error && (
                        <div className="login-error-message" style={{
                            padding: '10px',
                            backgroundColor: '#fee',
                            color: '#c00',
                            borderRadius: '4px',
                            marginBottom: '15px'
                        }}>
                            {status.error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        className="login-button"
                        disabled={status.loading}
                    >
                        {status.loading ? "Logging In..." : "Login"}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default Login;