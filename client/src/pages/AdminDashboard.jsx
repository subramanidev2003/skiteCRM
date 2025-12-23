import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, CheckSquare, CalendarDays, 
  Megaphone, UserPlus, LogOut, Menu, X 
} from 'lucide-react';
import skitelogo from '../assets/skitelogo.png';
import './AdminDashboard.css';

const API_BASE = 'http://localhost:4000/api';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [adminName, setAdminName] = useState('Admin');

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        const adminUser = localStorage.getItem('adminUser');
        if (!adminToken || !adminUser) {
            navigate('/');
        } else {
            const parsedUser = JSON.parse(adminUser);
            setAdminName(parsedUser?.name || 'Admin');
        }

        const handleResize = () => {
            if (window.innerWidth <= 768) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_BASE}/auth/admin-logout`, { method: 'POST' });
        } catch (err) { console.log(err); } 
        finally {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/');
        }
    };

    const isBaseDashboard = location.pathname === '/admin-dashboard' || location.pathname === '/admin-dashboard/';

    const NavItem = ({ icon: Icon, label, path, action }) => {
        const isActive = location.pathname.includes(path) && path !== '/admin-dashboard';
        return (
            <div 
                className={`nav-item ${isActive ? 'active' : ''}`} 
                onClick={() => {
                    action ? action() : navigate(path);
                    if (window.innerWidth <= 768) setIsSidebarOpen(false);
                }}
            >
                <Icon size={20} />
                <span>{label}</span>
            </div>
        );
    };

    return (
        <div className="admin-layout">
            
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <img src={skitelogo} alt="Logo" className="sidebar-logo" />
                    <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24}/>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">MAIN</div>
                    <NavItem icon={LayoutDashboard} label="Dashboard" path="/admin-dashboard" />
                    <NavItem icon={Users} label="Teams" path="/admin-dashboard/teams" />
                    <NavItem icon={CheckSquare} label="Tasks" path="/admin-dashboard/tasks" />
                    <NavItem icon={CalendarDays} label="Attendance" path="/admin-dashboard/attendance" />
                    <NavItem icon={Megaphone} label="Leads" path="/admin-dashboard/leads" />
                    
                    <div className="nav-section">ACTIONS</div>
                    <NavItem icon={UserPlus} label="Add Employee" action={() => navigate('/add-employee')} />
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            <div className="main-wrapper">
                <header className="top-header">
                    <div className="header-left-group">
                        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <div className="welcome-box">
                            <h1>Welcome back, {adminName} 👋</h1>
                            <p>Here's what's happening today.</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="date-display">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                </header>

                <div className="content-area">
                    {isBaseDashboard ? (
                        <div className="dashboard-widgets">
                            <div className="widget-card blue" onClick={() => navigate('/admin-dashboard/teams')}>
                                <div className="widget-icon"><Users size={32}/></div>
                                <div className="widget-info"><h3>Manage Teams</h3><p>View employees</p></div>
                            </div>
                            <div className="widget-card orange" onClick={() => navigate('/admin-dashboard/leads')}>
                                <div className="widget-icon"><Megaphone size={32}/></div>
                                <div className="widget-info"><h3>Sales Leads</h3><p>Track leads</p></div>
                            </div>
                            <div className="widget-card green" onClick={() => navigate('/admin-dashboard/tasks')}>
                                <div className="widget-icon"><CheckSquare size={32}/></div>
                                <div className="widget-info"><h3>Task Board</h3><p>Monitor progress</p></div>
                            </div>
                            <div className="widget-card purple" onClick={() => navigate('/add-employee')}>
                                <div className="widget-icon"><UserPlus size={32}/></div>
                                <div className="widget-info"><h3>Add Employee</h3><p>Onboard new members</p></div>
                            </div>
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;