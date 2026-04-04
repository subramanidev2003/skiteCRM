import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck, Users, Calendar, Banknote, FileText, 
  FileStack, ClipboardList, Receipt, BarChart3, LogOut, ShieldCheck 
} from 'lucide-react';
import './OfficerDashboard.css';

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('officerUser') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // ✅ FIX: எல்லா paths-உம் /officer/* — AdminDashboard layout bypass ஆகும்
  const menuItems = [
    { title: "Offer Letter",     icon: <FileCheck />,     path: "/officer/offer-letter",    color: "#6366f1" },
    { title: "Bulk Attendance",  icon: <Users />,         path: "/officer/bulk-attendance", color: "#ec4899" },
    { title: "Attendance Logs",  icon: <Calendar />,      path: "/officer/attendance",      color: "#f59e0b" },
    { title: "Payroll",          icon: <Banknote />,      path: "/officer/payroll",         color: "#10b981" },
    { title: "Invoices",         icon: <FileText />,      path: "/officer/invoice",         color: "#3b82f6" },
    { title: "Fixed Invoices",   icon: <FileStack />,     path: "/officer/fixed-invoice",   color: "#8b5cf6" },
    { title: "Quotes",           icon: <ClipboardList />, path: "/officer/quote",           color: "#06b6d4" },
    { title: "Payment Receipts", icon: <Receipt />,       path: "/officer/receipt",         color: "#f43f5e" },
    { title: "Accounts",         icon: <BarChart3 />,     path: "/officer/accounts",        color: "#22c55e" },
  ];

  return (
    <div className="off-container">
      <nav className="off-navbar">
        <div className="off-nav-left">
          <div className="off-logo-icon"><ShieldCheck size={28} /></div>
          <div>
            <h1 className="off-title">Officer Panel</h1>
            <p className="off-subtitle">Welcome back, {user.name || 'Officer'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="off-logout-btn">
          <LogOut size={18} /> Logout
        </button>
      </nav>

      <main className="off-content">
        <div className="off-grid">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="off-card"
              onClick={() => navigate(item.path)}
            >
              <div className="off-card-inner">
                <div className="off-icon-wrapper" style={{ '--icon-clr': item.color }}>
                  {item.icon}
                </div>
                <div className="off-card-info">
                  <h3>{item.title}</h3>
                  <p>Access & Control</p>
                </div>
              </div>
              <div className="off-card-arrow">→</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default OfficerDashboard;  