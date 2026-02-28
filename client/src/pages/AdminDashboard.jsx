import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; 
// ✅ NEW: Added FileCheck for Fixed Invoice
import { CalendarCheck, Megaphone, IndianRupee, FileText, ScrollText, Landmark, Briefcase, ReceiptText, FileCheck } from 'lucide-react';
import skitelogo from '../assets/skitelogo.png'; 
import { API_BASE } from '../api';
import './AdminDashboard.css'; 
    
// const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

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

const DashboardCards = ({ handleCardClick, role }) => (
    <div className="cards-container">

        {/* ADMIN ONLY */}
        {role === 'admin' && (
            <>
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
                <div className="card" onClick={() => handleCardClick('leads')}>
                    <div className="card-icon"><Megaphone size={40} color="#FF4500" /></div>
                    <div className="card-title1">Leads</div>
                    <div className="card-accent"></div>
                </div>
            </>
        )}

        {/* PROJECTS: Admin + Employee */}
        {(role === 'admin' || role === 'employee') && (
            <div className="card" onClick={() => handleCardClick('projects')}>
                <div className="card-icon"><Briefcase size={40} color="#FF4500" /></div>
                <div className="card-title1">Projects</div>
                <div className="card-accent"></div>
            </div>
        )}

        {/* ADMIN + ACCOUNTANT */}
        {(role === 'admin' || role === 'accountant') && (
            <>
                <div className="card" onClick={() => handleCardClick('payroll')}>
                    <div className="card-icon"><IndianRupee size={40} color="#FF4500" /></div>
                    <div className="card-title1">Payroll</div>
                    <div className="card-accent"></div>
                </div>
                
                <div className="card" onClick={() => handleCardClick('invoice')}>
                    <div className="card-icon"><FileText size={40} color="#FF4500" /></div>
                    <div className="card-title1">Invoice</div>
                    <div className="card-accent"></div>
                </div>

                {/* ✅ NEW: Fixed Invoice Card Added Here */}
                <div className="card" onClick={() => handleCardClick('fixed-invoice')}>
                    <div className="card-icon"><FileCheck size={40} color="#FF4500" /></div>
                    <div className="card-title1">Fixed Invoice</div>
                    <div className="card-accent"></div>
                </div>

                <div className="card" onClick={() => handleCardClick('quote')}>
                    <div className="card-icon"><ScrollText size={40} color="#FF4500" /></div>
                    <div className="card-title1">Quote</div>
                    <div className="card-accent"></div>
                </div>
                {/* ✅ Payment Receipt Card */}
                <div className="card" onClick={() => handleCardClick('receipt')}>
                    <div className="card-icon"><ReceiptText size={40} color="#FF4500" /></div>
                    <div className="card-title1">Payment Receipt</div>
                    <div className="card-accent"></div>
                </div>
                <div className="card" onClick={() => handleCardClick('accounts')}>
                    <div className="card-icon"><Landmark size={40} color="#FF4500" /></div>
                    <div className="card-title1">Accounts</div>
                    <div className="card-accent"></div>
                </div>
            </>
        )}
    </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        const accountantToken = localStorage.getItem('accountantToken');
        const employeeToken = localStorage.getItem('employeeToken');
        const storedRole = localStorage.getItem('userRole');

        if (!adminToken && !accountantToken && !employeeToken) {
            navigate('/');
        } else {
            if (storedRole) {
                setUserRole(storedRole);
            } else if (adminToken) {
                setUserRole('admin');
            } else if (accountantToken) {
                setUserRole('accountant');
            } else if (employeeToken) {
                setUserRole('employee');
            }
        }
    }, [navigate]);

    const isBaseDashboard = location.pathname === '/admin-dashboard' || location.pathname === '/admin-dashboard/';

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/auth/admin-logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("Logout API Error:", error);
        } finally {
            localStorage.clear();
            navigate('/');
            window.location.reload();
        }
    };

    const handleCardClick = (type) => {
        const routes = {
            'add': '/add-employee',
            'teams': '/admin-dashboard/teams',
            'tasks': '/admin-dashboard/tasks',
            'projects': '/admin-dashboard/projects',
            'attendance': '/admin-dashboard/attendance',
            'leads': '/admin-dashboard/leads',
            'payroll': '/admin-dashboard/payroll',
            'invoice': '/admin-dashboard/invoice',
            'fixed-invoice': '/admin-dashboard/fixed-invoice', // ✅ NEW: Routing for Fixed Invoice
            'quote': '/admin-dashboard/quote',
            'receipt': '/admin-dashboard/receipt',          
            'receipt-history': '/admin-dashboard/receipt-history',
            'accounts': '/admin-dashboard/accounts'
        };
        if (routes[type]) navigate(routes[type]);
    };

    return (
        <div className="admin-dashboard">
            <header className="header">
                <div className="header-left">
                    <div className="logo-container">
                        <img src={skitelogo} alt="Skite Logo" className="logo"
                            onClick={() => navigate('/admin-dashboard')}
                            style={{ cursor: 'pointer' }} />
                    </div>
                    <div className="header-title">
                        Welcome back {userRole.charAt(0).toUpperCase() + userRole.slice(1)}!
                    </div>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                    Logout <LogoutIcon />
                </button>
            </header>

            <main className={isBaseDashboard ? "main-content1" : "main-content-child"}>
                {isBaseDashboard && <DashboardCards handleCardClick={handleCardClick} role={userRole} />}
                <Outlet />
            </main>
        </div>
    );
};

export default AdminDashboard;