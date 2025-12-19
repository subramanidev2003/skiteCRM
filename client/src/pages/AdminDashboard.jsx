// D:/Desktop/skite/client/src/pages/AdminDashboard.jsx
import { CalendarCheck } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; 
import skitelogo from '../assets/skitelogo.png'; 
import './AdminDashboard.css'; 

const API_BASE = 'https://skitecrm.onrender.com/api';

// --- SVG Icons (EXPORTED for use in Task.jsx) ---
export const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);
export const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
);
export const TeamIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const TaskIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);
export const TaskCloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

// Component to display the initial cards only
const DashboardCards = ({ handleCardClick }) => (
    <div className="cards-container">
        {/* Updated: Clicking this now navigates to the new AddEmployee page */}
        <div className="card" onClick={() => handleCardClick('add')}>
            <div className="card-icon"><PlusIcon /></div>
            <div className="card-title1">Add employee</div>
            <div className="card-accent"></div>
        </div>

        <div className="card" onClick={() => handleCardClick('teams')}>
            <div className="card-icon"><TeamIcon /></div>
            <div className="card-title1">Teams</div>
            <div className="card-accent"></div>
        </div>

        <div className="card" onClick={() => handleCardClick('tasks')}>
            <div className="card-icon"><TaskIcon /></div>
            <div className="card-title1">Task</div>
            <div className="card-accent"></div>
        </div>
         <div className="card" onClick={() => handleCardClick('attendance')}>
            <div className="card-icon"><CalendarCheck size={40} color="#FF4500" /></div>
            <div className="card-title1">Attendance</div>
            <div className="card-accent"></div>
        </div>
    </div>
);


// ---------------- AdminDashboard Component ----------------
const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        
        if (!adminToken || !adminUser) {
            navigate('/');
        }
    }, [navigate]);
    
    // Check if we are exactly on the base dashboard URL
    const isBaseDashboard = location.pathname === '/admin-dashboard' || location.pathname === '/admin-dashboard/';

    // --- Handlers ---
    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/auth/admin-logout`, { method: 'POST' });
        } catch (err) { 
            console.log(err); 
        } finally {
            // ✅ FIXED: Clear admin-specific credentials
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/');
            window.location.reload(true);
        }
    };

    const handleCardClick = (type) => {
        if (type === 'add') {
            // Updated: Navigate to the dedicated Add Employee page
            navigate('/add-employee'); 
            return;
        }
        if (type === 'teams') {
            navigate('/admin-dashboard/teams'); 
            return;
        }
        if (type === 'tasks') {
            navigate('/admin-dashboard/tasks'); 
            return;
        }
         if (type === 'attendance') {
            navigate('/admin-dashboard/attendance'); 
            return;
        }
    };
    
    return (
        <div className="admin-dashboard">
             <header className="header">
                 <div className="header-left">
                     <div className="logo-container">
                         <img src={skitelogo} alt="Skite Logo" className="logo" />
                     </div>
                     <div className="header-title">Wellcome back sasiprakash!</div>
                 </div>
                 <button className="logout-button" onClick={handleLogout}>
                     Logout <LogoutIcon />
                 </button>
             </header>

             <main className="main-content">
                 {/* IF we are on the base dashboard path, show the cards */}
                 {isBaseDashboard && <DashboardCards handleCardClick={handleCardClick} />}

                 {/* The <Outlet /> renders the child component (like <Team /> or <Task />) */}
                 <Outlet />
             </main>
        </div>
    );
}

export default AdminDashboard;
