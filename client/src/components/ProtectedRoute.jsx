import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. GET ALL POSSIBLE CREDENTIALS
  const adminToken    = localStorage.getItem('adminToken');
  const adminUserStr  = localStorage.getItem('adminUser');

  const managerToken    = localStorage.getItem('managerToken');
  const managerUserStr  = localStorage.getItem('managerUser');

  const employeeToken    = localStorage.getItem('employeeToken');
  const employeeUserStr  = localStorage.getItem('employeeUser');

  const salesToken    = localStorage.getItem('salesToken');
  const salesUserStr  = localStorage.getItem('salesUser');

  const accountantToken    = localStorage.getItem('accountantToken');
  const accountantUserStr  = localStorage.getItem('accountantUser');

  const officerToken    = localStorage.getItem('officerToken');
  const officerUserStr  = localStorage.getItem('officerUser');

  // 2. DETERMINE ACTIVE SESSION
  // ✅ FIX: Removed all "userData" fallback branches — they caused wrong role detection.
  //         Each role uses only its own dedicated token + user key.
  //         Duplicate managerToken block also removed.
  let token   = null;
  let userStr = null;

  if (adminToken && adminUserStr) {
    token   = adminToken;
    userStr = adminUserStr;
  } else if (officerToken && officerUserStr) {
    // ✅ FIX: Officer is now checked BEFORE the generic fallbacks so it is never skipped.
    token   = officerToken;
    userStr = officerUserStr;
  } else if (managerToken && managerUserStr) {
    token   = managerToken;
    userStr = managerUserStr;
  } else if (accountantToken && accountantUserStr) {
    token   = accountantToken;
    userStr = accountantUserStr;
  } else if (salesToken && salesUserStr) {
    token   = salesToken;
    userStr = salesUserStr;
  } else if (employeeToken && employeeUserStr) {
    token   = employeeToken;
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
      const admT  = localStorage.getItem('adminToken');
      const accT  = localStorage.getItem('accountantToken');
      const mngT  = localStorage.getItem('managerToken');
      const offT  = localStorage.getItem('officerToken');
      const salesT = localStorage.getItem('salesToken');
      const empT  = localStorage.getItem('employeeToken');

      const role = user.role.toLowerCase();

      if (
        (role === 'admin'      && !admT)  ||
        (role === 'accountant' && !accT)  ||
        (role === 'manager'    && !mngT)  ||
        (role === 'officer'    && !offT)  ||
        (role === 'sales'      && !salesT)||
        (role === 'employee'   && !empT)
      ) {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, user]);

  // 6. ROLE-BASED ACCESS CONTROL (RBAC)
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole        = user.role.toLowerCase();
    const userDesignation = (user.designation || '').toLowerCase();

    let isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

    // Manager with designation "manager" can access /admin-dashboard
    if (userRole === 'manager' && location.pathname.startsWith('/admin-dashboard')) {
      isAllowed = userDesignation === 'manager';
    }

    if (!isAllowed) {
      console.log(`⚠️ Access Denied: ${userRole} | Designation: ${userDesignation}`);

      if (userRole === 'admin' || userRole === 'accountant') return <Navigate to="/admin-dashboard"    replace />;
      if (userRole === 'manager')  return <Navigate to="/manager-dashboard"  replace />;
      if (userRole === 'officer')  return <Navigate to="/officer-dashboard"  replace />;
      if (userRole === 'sales')    return <Navigate to="/sales-dashboard"    replace />;
      if (userRole === 'employee') return <Navigate to="/employee-dashboard" replace />;

      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;