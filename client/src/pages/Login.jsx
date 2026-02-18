import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from "lottie-react";
import skitelogo from '../assets/skitelogo.png'; 
import rocketAnimation from '../assets/rocket.json'; 
import './Login.css';

const API_BASE = 'https://skitecrm.onrender.com/api';

const Login = () => {
    const navigate = useNavigate();
    const lottieRef = useRef();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [status, setStatus] = useState({
        loading: false,
        error: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (lottieRef.current) {
                lottieRef.current.setSpeed(0.5); 
            }
        }, 5000); 

        return () => clearTimeout(timer);
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                const role = data.user.role.toLowerCase(); 
                
                let targetPath = '/employee-dashboard';
                if (role === 'admin' || role === 'accountant') targetPath = '/admin-dashboard';
                else if (role === 'manager') targetPath = '/manager-dashboard';
                else if (role === 'sales') targetPath = '/sales-dashboard';

                localStorage.setItem(`${role}Token`, data.token);
                localStorage.setItem('userRole', role);
                localStorage.setItem(`${role}User`, JSON.stringify(data.user));
                localStorage.setItem('userData', JSON.stringify(data.user));

                setTimeout(() => navigate(targetPath, { replace: true }), 100);

            } else {
                setStatus({ loading: false, error: data.message || 'Login failed' });
            }
        } catch (err) {
            setStatus({ loading: false, error: 'Server error' });
        }
    };

    return (
        <div className="login-page">
            <div className="flying-container">
                <div className="login-card">
                    
                    {/* ✅ ராக்கெட் மட்டும் (கயிறு இல்லை) */}
                    <div className="rocket-wrapper">
                        <Lottie 
                            lottieRef={lottieRef}
                            animationData={rocketAnimation} 
                            loop={true} 
                            className="rocket-lottie"
                        />
                    </div>

                    <img src={skitelogo} alt="Skite Logo" className="login-logo" />
                    <h2 className="login-title">Skite Login</h2>

                    <form onSubmit={handleLogin}>
                        {status.error && (
                            <div className="login-error-message" style={{padding: '10px', background: '#fee', color: '#c00', borderRadius:'4px', marginBottom:'10px'}}>
                                {status.error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder="Enter your email" required />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" placeholder="Enter your password" required />
                        </div>

                        <button type="submit" className="login-button" disabled={status.loading}>
                            {status.loading ? "Logging In..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
