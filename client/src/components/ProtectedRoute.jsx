import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const navigate = useNavigate();
  
  // console.log('🔒 ProtectedRoute checking...', { allowedRoles });
  
  // ✅ Get role-specific credentials
  const employeeToken = localStorage.getItem('employeeToken');
  const employeeUserStr = localStorage.getItem('employeeUser');
  const adminToken = localStorage.getItem('adminToken');
  const adminUserStr = localStorage.getItem('adminUser');
  
  // console.log('📦 LocalStorage check:', {
  //   employeeToken: employeeToken ? 'exists' : 'missing',
  //   employeeUser: employeeUserStr ? 'exists' : 'missing',
  //   adminToken: adminToken ? 'exists' : 'missing',
  //   adminUser: adminUserStr ? 'exists' : 'missing'
  // });
  
  // Determine which credentials to use
  let token = null;
  let userStr = null;
  
  if (employeeToken && employeeUserStr) {
    token = employeeToken;
    userStr = employeeUserStr;
    // console.log('✅ Using employee credentials');
  } else if (adminToken && adminUserStr) {
    token = adminToken;
    userStr = adminUserStr;
    // console.log('✅ Using admin credentials');
  }
  
  // Parse user object safely
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
      // console.log('👤 User parsed:', { name: user.name, role: user.role });
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      localStorage.clear();
      return <Navigate to="/" replace />;
    }
  }

  // Check if user is logged in
  if (!token || !user) {
    console.log('❌ No valid credentials found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // ✅ ADD THIS: Listen for storage changes (logout in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      // console.log('🔄 Storage changed, re-checking credentials...');
      
      const empToken = localStorage.getItem('employeeToken');
      const admToken = localStorage.getItem('adminToken');
      
      // If the current user's credentials are gone, redirect
      if (user.role.toLowerCase() === 'employee' && !empToken) {
        console.log('⚠️ Employee credentials removed, redirecting...');
        navigate('/', { replace: true });
      } else if (user.role.toLowerCase() === 'admin' && !admToken) {
        console.log('⚠️ Admin credentials removed, redirecting...');
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, user]);

  // Check Role Permissions
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role;
    const isAllowed = allowedRoles.some(role => 
      role.toLowerCase() === userRole.toLowerCase()
    );

    // console.log('🔐 Role check:', { 
    //   userRole, 
    //   allowedRoles, 
    //   isAllowed 
    // });

    if (!isAllowed) {
      console.log('⚠️ User not allowed, redirecting based on role');
      if (userRole.toLowerCase() === 'admin') {
        return <Navigate to="/admin-dashboard" replace />;
      } else if (userRole.toLowerCase() === 'employee') {
        return <Navigate to="/employee-dashboard" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  // console.log('✅ Access granted!');
  return <Outlet />;
};

export default ProtectedRoute;