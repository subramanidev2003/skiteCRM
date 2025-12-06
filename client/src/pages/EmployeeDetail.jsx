import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Lock, Calendar, Briefcase, FileText, 
  CreditCard, Building, ArrowLeft, Edit, Trash2
} from 'lucide-react';
import './EmployeeDetail.css';

const API_BASE = 'http://localhost:4000/api';
const API_UPLOAD = 'http://localhost:4000/uploads';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('Employee ID:', id);
  
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
      console.log('Employee data received:', data);

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
      <div className="details-container">
        <div className="loading-text">Loading employee details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="details-container">
        <div className="error-box">{error}</div>
        <button className="back-btn" onClick={() => navigate('/admin-dashboard/teams')}>
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="details-container">
        <div className="error-box">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="details-container">
      <div className="details-wrapper">
        {/* Header */}
        <div className="details-header">
          <button
            className="back-btn"
            onClick={() => navigate("/admin-dashboard/teams")}
          >
            <ArrowLeft size={20} /> Back
          </button>
          <div className="header-actions">
            <button
              className="edit-btn"
              onClick={() => navigate(`/admin-dashboard/teams/edit/${id}`)}
            >
              <Edit size={18} /> Edit
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              <Trash2 size={18} /> Delete
            </button>
          </div>
        </div>

        {/* Profile Section - ✅ FIXED: Changed profileImage to image */}
        <div className="profile-section">
          <div className="profile-image-container">
            {employee.image ? (
              <>
                <img
                  src={`${API_UPLOAD}/${employee.image}`}
                  alt={employee.name}
                  className="profile-image"
                  onError={(e) => {
                    console.error("❌ Image failed to load!");
                    console.log(
                      "Image path:",
                      `${API_UPLOAD}/${employee.image}`
                    );
                    console.log("Full employee data:", employee);

                    fetch(`${API_UPLOAD}/${employee.image}`)
                      .then((response) => {
                        console.log("Image fetch status:", response.status);
                        console.log("Image fetch headers:", response.headers);
                      })
                      .catch((err) => console.error("Fetch error:", err));

                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                  onLoad={() => {
                    console.log(
                      "✅ Image loaded successfully:",
                      `${API_UPLOAD}/${employee.image}`
                    );
                  }}
                />
                <div className="image-debug">
                  <small>Image: {employee.image}</small>
                </div>
              </>
            ) : null}
            <div
              className="profile-placeholder"
              style={{ display: employee.image ? "none" : "flex" }}
            >
              <User size={60} color="#cbd5e1" />
            </div>
          </div>
          <div className="profile-info">
            <h1 className="employee-name">{employee.name}</h1>
            <p className="employee-designation">
              {employee.designation || "N/A"}
            </p>
            <span className="role-badge">
              {employee.role === "Admin" ? "👑 Admin" : "👤 Employee"}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="details-grid">
          {/* Personal Information */}
          <div className="detail-card">
            <h2 className="card-title">
              <User size={20} className="icon-blue1" />
              Personal Information
            </h2>
            <div className="details-content">
              <div className="detail-row">
                <div className="detail-label">
                  <User size={16} className="icon-blue1" />
                  <span>Full Name</span>
                </div>
                <span className="detail-value">{employee.name}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <Mail size={16} className="icon-blue1" />
                  <span>Email Address</span>
                </div>
                <span className="detail-value">{employee.email}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <Lock size={16} className="icon-blue1" />
                  <span>Password</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="detail-value" style={{ fontStyle: 'italic', color: '#64748b' }}>
                    Hidden for security
                  </span>
                  <button
                    onClick={() => navigate(`/admin-dashboard/teams/edit/${id}`)}
                    className="eye-btn"
                    title="Reset password in edit mode"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <Calendar size={16} className="icon-blue1" />
                  <span>Date of Birth</span>
                </div>
                <span className="detail-value">{formatDate(employee.dob)}</span>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="detail-card">
            <h2 className="card-title">
              <Briefcase size={20} className="icon-blue1" />
              Professional Details
            </h2>
            <div className="details-content">
              <div className="detail-row">
                <div className="detail-label">
                  <Briefcase size={16} className="icon-blue1" />
                  <span>Designation</span>
                </div>
                <span className="detail-value">
                  {employee.designation || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <User size={16} className="icon-blue1" />
                  <span>Role</span>
                </div>
                <span className="detail-value">{employee.role}</span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <Calendar size={16} className="icon-blue1" />
                  <span>Joining Date</span>
                </div>
                <span className="detail-value">
                  {formatDate(employee.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="detail-card">
            <h2 className="card-title">
              <FileText size={20} className="icon-blue1" />
              Documents
            </h2>
            <div className="details-content">
              <div className="detail-row">
                <div className="detail-label">
                  <FileText size={16} className="icon-blue1" />
                  <span>PAN Number</span>
                </div>
                <span className="detail-value">
                  {employee.panNumber || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <FileText size={16} className="icon-blue1" />
                  <span>Aadhar Number</span>
                </div>
                <span className="detail-value">
                  {employee.aadharNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="detail-card">
            <h2 className="card-title">
              <CreditCard size={20} className="icon-blue1" />
              Bank Details
            </h2>
            <div className="details-content">
              <div className="detail-row">
                <div className="detail-label">
                  <Building size={16} className="icon-blue1" />
                  <span>Bank Name</span>
                </div>
                <span className="detail-value">
                  {employee.bankDetails?.bankName || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <CreditCard size={16} className="icon-blue1" />
                  <span>Account Number</span>
                </div>
                <span className="detail-value">
                  {employee.bankDetails?.accountNumber || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <div className="detail-label">
                  <FileText size={16} className="icon-blue1" />
                  <span>IFSC Code</span>
                </div>
                <span className="detail-value">
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