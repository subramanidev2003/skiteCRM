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
        
        console.log('Login attempt started');
        
        setStatus({ loading: true, error: '' });

        // ✅ CLEAR ALL PREVIOUS AUTH DATA
        localStorage.clear(); 
        
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // credentials: 'include', // Uncomment if using cookies/sessions
                body: JSON.stringify(formData)
            });

            console.log('Response status:', res.status);
            
            const data = await res.json();
            console.log('Response data:', data);

            if (res.ok) {
                console.log('Login successful!');
                console.log('User role:', data.user.role);
                
                setStatus({ loading: false, error: '' });

                // Ensure role is lowercase for comparison
                const role = data.user.role.toLowerCase();
                
                // --- ADMIN ---
                if (role === 'admin') {
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    
                    setTimeout(() => {
                        navigate('/admin-dashboard', { replace: true });
                    }, 100);
                } 
                // --- MANAGER ---
                else if (role === 'manager') {
                    localStorage.setItem('managerToken', data.token);
                    localStorage.setItem('managerUser', JSON.stringify(data.user));
                    
                    setTimeout(() => {
                        navigate('/manager-dashboard', { replace: true });
                    }, 100);
                }
                // --- SALES (NEW ADDITION) ---
                else if (role === 'sales') {
                    localStorage.setItem('salesToken', data.token);
                    localStorage.setItem('salesUser', JSON.stringify(data.user));

                    console.log('Sales credentials stored');

                    setTimeout(() => {
                        navigate('/sales-dashboard', { replace: true });
                    }, 100);
                }
                // --- EMPLOYEE ---
                else if (role === 'employee') {
                    localStorage.setItem('employeeToken', data.token);
                    localStorage.setItem('employeeUser', JSON.stringify(data.user));
                    
                    setTimeout(() => {
                        navigate('/employee-dashboard', { replace: true });
                    }, 100);
                } 
                // --- UNKNOWN ---
                else {
                    console.error('Unknown role:', data.user.role);
                    setStatus({ 
                        loading: false, 
                        error: 'Invalid user role. Please contact administrator.' 
                    });
                }

            } else {
                console.error('Login failed:', data);
                setStatus({ 
                    loading: false, 
                    error: data.message || 'Login failed. Please check your credentials.' 
                });
            }
        } catch (err) {
            console.error('Login error:', err);
            setStatus({
                loading: false,
                error: 'Network error. Please check if the server is running on port 4000.'
            });
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