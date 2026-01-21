import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Calendar, Briefcase, FileText, 
  CreditCard, Building, ArrowLeft, Edit, Trash2
} from 'lucide-react';
import './EmployeeDetail.css';

const API_BASE = 'https://skitecrm.onrender.com/api';
const API_UPLOAD = 'https://skitecrm.onrender.com/api/uploads';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setEmployee(data);
      } else {
        setError(data.message || 'Failed to load employee details');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error. Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${employee.name}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(`${API_BASE}/user/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert('Employee deleted successfully!');
        navigate('/admin-dashboard/teams');
      } else {
        alert(`Error: ${data.message || 'Failed to delete employee'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting employee.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="ed-loading">
        Loading employee details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ed-container">
        <div className="ed-error">{error}</div>
        <button className="ed-back-btn" onClick={() => navigate('/admin-dashboard/teams')}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="ed-container">
        <div className="ed-error">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="ed-container">
      <div className="ed-wrapper">
        
        {/* Header */}
        <div className="ed-header">
          <button
            className="ed-back-btn"
            onClick={() => navigate("/admin-dashboard/teams")}
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="ed-header-actions">
            <button
              className="ed-btn ed-edit-btn"
              onClick={() => navigate(`/admin-dashboard/teams/edit/${id}`)}
            >
              <Edit size={18} /> Edit
            </button>
            <button className="ed-btn ed-delete-btn" onClick={handleDelete}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>

        {/* Profile Section */}
        <div className="ed-profile-section">
          <div className="ed-profile-img-box">
            {employee.image ? (
              <img
                src={`${API_UPLOAD}/${employee.image}`}
                alt={employee.name}
                className="ed-profile-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="ed-profile-placeholder"
              style={{ display: employee.image ? "none" : "flex" }}
            >
              <User size={50} color="#cbd5e1" />
            </div>
          </div>
          
          <div className="ed-profile-info">
            <h1 className="employee-name">{employee.name}</h1>
            <p className="ed-designation">
              {employee.designation || "N/A"}
            </p>
            <span className="ed-role-badge">
              {employee.role === "Admin" ? "👑 Admin" : "👤 Employee"}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="ed-grid">
          
          {/* Personal Information */}
          <div className="ed-card">
            <h2 className="ed-card-title">
              <User size={20} className="ed-icon-primary" />
              Personal Information
            </h2>
            <div className="ed-content">
              <div className="ed-row">
                <div className="ed-label">
                  <User size={16} className="ed-icon-primary" />
                  <span>Full Name</span>
                </div>
                <span className="ed-value">{employee.name}</span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <Mail size={16} className="ed-icon-primary" />
                  <span>Email</span>
                </div>
                <span className="ed-value">{employee.email}</span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <Lock size={16} className="ed-icon-primary" />
                  <span>Password</span>
                </div>
                <span className="ed-value" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                  Hidden
                </span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <Calendar size={16} className="ed-icon-primary" />
                  <span>Date of Birth</span>
                </div>
                <span className="ed-value">{formatDate(employee.dob)}</span>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="ed-card">
            <h2 className="ed-card-title">
              <Briefcase size={20} className="ed-icon-primary" />
              Professional Details
            </h2>
            <div className="ed-content">
              <div className="ed-row">
                <div className="ed-label">
                  <Briefcase size={16} className="ed-icon-primary" />
                  <span>Designation</span>
                </div>
                <span className="ed-value">
                  {employee.designation || "N/A"}
                </span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <User size={16} className="ed-icon-primary" />
                  <span>Role</span>
                </div>
                <span className="ed-value">{employee.role}</span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <Calendar size={16} className="ed-icon-primary" />
                  <span>Joining Date</span>
                </div>
                <span className="ed-value">
                  {formatDate(employee.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="ed-card">
            <h2 className="ed-card-title">
              <FileText size={20} className="ed-icon-primary" />
              Documents
            </h2>
            <div className="ed-content">
              <div className="ed-row">
                <div className="ed-label">
                  <FileText size={16} className="ed-icon-primary" />
                  <span>PAN Number</span>
                </div>
                <span className="ed-value">
                  {employee.panNumber || "N/A"}
                </span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <FileText size={16} className="ed-icon-primary" />
                  <span>Aadhar Number</span>
                </div>
                <span className="ed-value">
                  {employee.aadharNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="ed-card">
            <h2 className="ed-card-title">
              <CreditCard size={20} className="ed-icon-primary" />
              Bank Details
            </h2>
            <div className="ed-content">
              <div className="ed-row">
                <div className="ed-label">
                  <Building size={16} className="ed-icon-primary" />
                  <span>Bank Name</span>
                </div>
                <span className="ed-value">
                  {employee.bankDetails?.bankName || "N/A"}
                </span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <CreditCard size={16} className="ed-icon-primary" />
                  <span>Account No</span>
                </div>
                <span className="ed-value">
                  {employee.bankDetails?.accountNumber || "N/A"}
                </span>
              </div>
              <div className="ed-row">
                <div className="ed-label">
                  <FileText size={16} className="ed-icon-primary" />
                  <span>IFSC Code</span>
                </div>
                <span className="ed-value">
                  {employee.bankDetails?.ifscCode || "N/A"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;