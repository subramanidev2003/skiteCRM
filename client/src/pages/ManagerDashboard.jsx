import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, UserCheck, ArrowRight, LogOut } from 'lucide-react';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('managerUser'));

  const handleLogout = () => {
    // Clear manager-specific data
    localStorage.removeItem('managerToken');
    localStorage.removeItem('managerUser');
    // Optional: Clear everything to be safe
    // localStorage.clear(); 
    
    navigate('/', { replace: true });
  };

  const managerActions = [
    {
      title: "Task Management",
      desc: "Assign and track tasks for Developers & SEO interns",
      icon: <ClipboardList size={32} />,
      path: "/manager-dashboard/tasks",
      color: "#4f46e5"
    },
    {
      title: "Attendance Records",
      desc: "Monitor daily check-ins and performance",
      icon: <UserCheck size={32} />,
      path: "/manager-dashboard/attendance",
      color: "#10b981"
    }
  ];

  return (
    <div className="manager-container">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manager Control Center</h1>
          <p>Welcome back, {user?.name || 'Manager'}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="manager-actions-grid">
        {managerActions.map((action, index) => (
          <div key={index} className="action-card" onClick={() => navigate(action.path)}>
            <div className="action-icon" style={{ backgroundColor: action.color + '20', color: action.color }}>
              {action.icon}
            </div>
            <div className="action-info">
              <h3>{action.title}</h3>
              <p>{action.desc}</p>
            </div>
            <ArrowRight className="arrow-icon" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDashboard;