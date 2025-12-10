import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import skitelogo from '../assets/skitelogo.png';
import './Login.css';

const API_BASE = 'http://localhost:4000/api';

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
        console.log('Form data:', formData);
        
        setStatus({ loading: true, error: '' });

        // ✅ CLEAR ALL PREVIOUS AUTH DATA BEFORE LOGIN
        localStorage.clear(); // Clear everything to be safe
        
        try {
            console.log('Sending request to:', `${API_BASE}/auth/login`);
            
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            console.log('Response status:', res.status);
            
            const data = await res.json();
            console.log('Response data:', data);

            if (res.ok) {
                console.log('Login successful!');
                console.log('User role:', data.user.role);
                
                setStatus({ loading: false, error: '' });

                const role = data.user.role.toLowerCase();
                
                // ✅ SAVE WITH ROLE-SPECIFIC KEYS
                if (role === 'admin') {
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    
                    console.log('Admin credentials stored');
                    console.log('Stored adminToken:', localStorage.getItem('adminToken'));
                    console.log('Stored adminUser:', localStorage.getItem('adminUser'));
                    
                    // ✅ Wait a bit for localStorage to sync, then navigate
                    setTimeout(() => {
                        console.log('Navigating to admin dashboard');
                        navigate('/admin-dashboard', { replace: true });
                    }, 100);
                    
                } else if (role === 'employee') {
                    localStorage.setItem('employeeToken', data.token);
                    localStorage.setItem('employeeUser', JSON.stringify(data.user));
                    
                    console.log('Employee credentials stored');
                    console.log('Stored employeeToken:', localStorage.getItem('employeeToken'));
                    console.log('Stored employeeUser:', localStorage.getItem('employeeUser'));
                    
                    // ✅ Wait a bit for localStorage to sync, then navigate
                    setTimeout(() => {
                        console.log('Navigating to employee dashboard');
                        navigate('/employee-dashboard', { replace: true });
                    }, 100);
                    
                } else {
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
                <h2 className="login-title">Employee Login</h2>

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
