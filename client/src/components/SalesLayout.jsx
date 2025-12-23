import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import '../pages/SalesDashboard.css'; // Ensure we use the dashboard styles

const SalesLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("salesUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("salesToken");
    localStorage.removeItem("salesUser");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* ✅ PERSISTENT HEADER (Visible on all Sales Pages) */}
      <header className="top-nav">
              <div className="nav-brand">
                <h2>Skite CRM</h2>
                <span className="badge-role">Sales Panel</span>
              </div>
              <div className="nav-user">
                <div className="user-profile">
                  <div className="avatar-circle">{user?.name?.charAt(0) || 'S'}</div>
                  <div className="user-details-text">
                      <span className="name">{user?.name}</span>
                      <span className="role">Sales Executive</span>
                  </div>
                </div>
                <button className="btn-logout-icon" onClick={handleLogout} title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            </header>

      {/* ✅ PAGE CONTENT RENDEERS HERE */}
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
};

export default SalesLayout;