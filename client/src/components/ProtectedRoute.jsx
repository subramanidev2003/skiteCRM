import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. GET ALL POSSIBLE CREDENTIALS
  const adminToken = localStorage.getItem('adminToken');
  const adminUserStr = localStorage.getItem('adminUser'); 
  
  const managerToken = localStorage.getItem('managerToken');
  const managerUserStr = localStorage.getItem('managerUser');
  
  const employeeToken = localStorage.getItem('employeeToken');
  const employeeUserStr = localStorage.getItem('employeeUser');

  const salesToken = localStorage.getItem('salesToken');
  const salesUserStr = localStorage.getItem('salesUser');

  const accountantToken = localStorage.getItem('accountantToken');
  // ✅ FIX: userData-ஐ accountant-க்கு மட்டும் use பண்ணாம,
  // தனியா எடுக்கோம் - token verify பண்ணிட்டே use பண்ணோம்
  const accountantUserStr = localStorage.getItem('accountantUser');

  // 2. DETERMINE ACTIVE SESSION
  // ✅ FIX: Token இருக்கற session மட்டும் pick பண்றோம்
  let token = null;
  let userStr = null;

  if (adminToken && adminUserStr) {
    // Admin: adminToken + adminUser
    token = adminToken;
    userStr = adminUserStr;
  }
  else if (adminToken && localStorage.getItem('userData')) {
    // Admin: adminToken + userData
    token = adminToken;
    userStr = localStorage.getItem('userData');
  }
  else if (managerToken && managerUserStr) {
    // ✅ Manager: managerToken + managerUser
    token = managerToken;
    userStr = managerUserStr;
  }
  else if (managerToken && localStorage.getItem('userData')) {
    // ✅ Manager: managerToken + userData (login-ல userData save ஆனா)
    token = managerToken;
    userStr = localStorage.getItem('userData');
  }
  else if (accountantToken && accountantUserStr) {
    token = accountantToken;
    userStr = accountantUserStr;
  }
  else if (accountantToken && localStorage.getItem('userData')) {
    // Accountant: accountantToken + userData
    token = accountantToken;
    userStr = localStorage.getItem('userData');
  }
  else if (salesToken && salesUserStr) {
    token = salesToken;
    userStr = salesUserStr;
  } 
  else if (employeeToken && employeeUserStr) {
    token = employeeToken;
    userStr = employeeUserStr;
  }

  // 3. SAFE PARSE
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

  // 4. CHECK LOGGED IN STATUS
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // 5. CROSS-TAB LOGOUT SYNC
  useEffect(() => {
    const handleStorageChange = () => {
      const admT = localStorage.getItem('adminToken');
      const accT = localStorage.getItem('accountantToken');
      const mngT = localStorage.getItem('managerToken');
      const salesT = localStorage.getItem('salesToken');
      const empT = localStorage.getItem('employeeToken');

      const role = user.role.toLowerCase();
      
      if ((role === 'admin' && !admT) || 
          (role === 'accountant' && !accT) || 
          (role === 'manager' && !mngT) || 
          (role === 'sales' && !salesT) || 
          (role === 'employee' && !empT)) {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, user]);

  // 6. ROLE-BASED ACCESS CONTROL (RBAC)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role.toLowerCase();
    // ✅ FIX: toLowerCase() - "MANAGER" → "manager" correct-ஆ compare ஆகும்
    const userDesignation = (user.designation || "").toLowerCase();
    
    let isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

    // ✅ FIX: Manager + designation "manager" → admin routes allow
    if (userRole === 'manager' && location.pathname.startsWith('/admin-dashboard')) {
      if (userDesignation === 'manager') {
        isAllowed = true; // ✅ "MANAGER" → toLowerCase → "manager" → allowed!
      } else {
        isAllowed = false;
      }
    }

    if (!isAllowed) {
      console.log(`⚠️ Access Denied: ${userRole} | Designation: ${userDesignation}`);
      
      if (userRole === 'admin' || userRole === 'accountant') return <Navigate to="/admin-dashboard" replace />;
      if (userRole === 'manager') return <Navigate to="/manager-dashboard" replace />;
      if (userRole === 'sales') return <Navigate to="/sales-dashboard" replace />;
      if (userRole === 'employee') return <Navigate to="/employee-dashboard" replace />;
      
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;