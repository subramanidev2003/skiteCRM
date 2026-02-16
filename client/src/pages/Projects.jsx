import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Globe, Search, MousePointerClick } from 'lucide-react';
import skitelogo from '../assets/skitelogo.png'; 
import './AdminDashboard.css'; 

// Logout Icon Component
const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

const Projects = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('Admin'); 

  useEffect(() => {
      const role = localStorage.getItem('userRole');
      const employeeToken = localStorage.getItem('employeeToken');

      if (role) {
          setUserRole(role);
      } else if (employeeToken) {
          setUserRole('employee');
      }
  }, []);

  // --- DYNAMIC BACK HANDLER ---
  const handleBack = () => {
      const role = localStorage.getItem('userRole');
      if (role === 'employee') {
          navigate('/employee-dashboard');
      } else {
          navigate('/admin-dashboard');
      }
  };

  // --- Logout Handler ---
  const handleLogout = () => {
      localStorage.clear();
      navigate('/');
      window.location.reload();
  };

  // ✅ Project Data List (Updated Path)
  const projectList = [
    { 
      title: 'Social Media Marketing', 
      icon: <Share2 size={40} color="#FF4500" />, 
      // 👇 மாற்றம்: இது நேரடியாக புதிய Workflow பக்கத்திற்குச் செல்லும்
      path: '/social-media/clients' 
    },
   { 
  title: 'Website Development', 
  icon: <Globe size={40} color="#FF4500" />, 
  path: '/webdev/clients'  // ✅ Updated Path
},
    { 
      title: 'SEO', 
      icon: <Search size={40} color="#FF4500" />, 
      path: '/projects/seo' 
    },
    { 
      title: 'Meta Ads', 
      icon: <MousePointerClick size={40} color="#FF4500" />, 
      path: '/projects/meta-ads' 
    }
  ];

  return (
    <div className="admin-dashboard"> 
      
      {/* --- HEADER SECTION --- */}

      {/* --- MAIN CONTENT --- */}
      <main className="main-content-child" style={{ padding: '30px' }}>
        
        {/* BACK BUTTON & TITLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
            <button 
                onClick={handleBack} 
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'white',
                    border: '1px solid #e0e0e0', padding: '10px 20px', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '15px', fontWeight: '600', color: '#4b5563',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: 'all 0.2s ease'
                }}
            >
                <ArrowLeft size={20} /> Back
            </button>
            <h1 style={{ margin: 0, color: '#111827', fontSize: '24px' }}>Our Projects</h1>
        </div>

        {/* CARDS CONTAINER */}
        <div className="cards-container">
            {projectList.map((project, index) => (
            <div 
                key={index} 
                className="card" 
                onClick={() => navigate(project.path)}
                style={{ cursor: 'pointer' }}
            >
                <div className="card-icon">{project.icon}</div>
                <div className="card-title1">{project.title}</div>
                <div className="card-accent"></div>
            </div>
            ))}
        </div>

      </main>
    </div>
  );
}

export default Projects;