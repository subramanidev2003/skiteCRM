import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const navigate = useNavigate();
  
  // 1. Get ALL possible role credentials from LocalStorage
  const adminToken = localStorage.getItem('adminToken');
  const adminUserStr = localStorage.getItem('adminUser');
  
  const managerToken = localStorage.getItem('managerToken');
  const managerUserStr = localStorage.getItem('managerUser');
  
  const employeeToken = localStorage.getItem('employeeToken');
  const employeeUserStr = localStorage.getItem('employeeUser');

  // ✅ ADDED: Get Sales Credentials
  const salesToken = localStorage.getItem('salesToken');
  const salesUserStr = localStorage.getItem('salesUser');

  // 2. Determine which set of credentials to use
  let token = null;
  let userStr = null;

  if (adminToken && adminUserStr) {
    token = adminToken;
    userStr = adminUserStr;
  } else if (managerToken && managerUserStr) {
    token = managerToken;
    userStr = managerUserStr;
  } else if (salesToken && salesUserStr) { // ✅ ADDED: Check Sales
    token = salesToken;
    userStr = salesUserStr;
  } else if (employeeToken && employeeUserStr) {
    token = employeeToken;
    userStr = employeeUserStr;
  }

  // 3. Parse user object safely
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      localStorage.clear();
      return <Navigate to="/" replace />;
    }
  }

  // 4. Check if user is logged in at all
  if (!token || !user) {
    console.log('❌ No valid session found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // 5. Handle cross-tab logout (Storage Sync)
  useEffect(() => {
    const handleStorageChange = () => {
      const admT = localStorage.getItem('adminToken');
      const mngT = localStorage.getItem('managerToken');
      const salesT = localStorage.getItem('salesToken'); // ✅ ADDED
      const empT = localStorage.getItem('employeeToken');

      // If the user's specific token is cleared, boot them out
      const role = user.role.toLowerCase();
      if ((role === 'admin' && !admT) || 
          (role === 'manager' && !mngT) || 
          (role === 'sales' && !salesT) || // ✅ ADDED
          (role === 'employee' && !empT)) {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, user]);

  // 6. Role-Based Access Control (RBAC)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role.toLowerCase();
    const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!isAllowed) {
      console.log(`⚠️ Access Denied for role: ${userRole}. Required: ${allowedRoles}`);
      
      // Redirect to their specific "Home" dashboard if they try to access a forbidden area
      if (userRole === 'admin') return <Navigate to="/admin-dashboard" replace />;
      if (userRole === 'manager') return <Navigate to="/manager-dashboard" replace />;
      if (userRole === 'sales') return <Navigate to="/sales-dashboard" replace />; // ✅ ADDED
      if (userRole === 'employee') return <Navigate to="/employee-dashboard" replace />;
      
      return <Navigate to="/" replace />;
    }
  }

  // If everything is fine, render the requested page
  return <Outlet />;
};

export default ProtectedRoute;