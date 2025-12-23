import React, { useState } from 'react';
import { 
  User, Mail, Lock, Briefcase, Calendar, 
  CreditCard, FileText, Upload, Save, ArrowLeft, Image as ImageIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Addemployee.css';


const API_BASE = 'http://localhost:4000/api'


const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    role: '',
    joiningDate: '',
    dob: '',
    panNumber: '',
    aadharNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    profileImage: null
  });

  // Handle Text Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = new FormData();
    
    // Append all fields
    dataToSend.append('name', formData.name);
    dataToSend.append('email', formData.email);
    dataToSend.append('password', formData.password);
    dataToSend.append('role', formData.role);
    dataToSend.append('designation', formData.designation);
    dataToSend.append('dob', formData.dob);
    dataToSend.append('joiningDate', formData.joiningDate);
    dataToSend.append('panNumber', formData.panNumber);
    dataToSend.append('aadharNumber', formData.aadharNumber);
    dataToSend.append('bankName', formData.bankName);
    dataToSend.append('accountNumber', formData.accountNumber);
    dataToSend.append('ifscCode', formData.ifscCode);

    if (formData.profileImage) {
      dataToSend.append('image', formData.profileImage);
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: dataToSend
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON Response:', text);
        throw new Error('Server returned an invalid response. Please check server logs.');
      }

      const data = await response.json();

      if (response.ok) {
        alert('Employee Added Successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          designation: '',
          role: '',
          joiningDate: '',
          dob: '',
          panNumber: '',
          aadharNumber: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          profileImage: null
        });
        setImagePreview(null);
      } else {
        const errorMsg = data.message || 'Failed to add employee';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Request Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-emp-page-container">
      <button
        className="task-btn-back"
        onClick={() => navigate("/admin-dashboard")}
      >
        <ArrowLeft size={20} /> Back To Dashboard
      </button>

      <div className="add-emp-form-card">
        {/* Header */}
        <div className="add-emp-form-header">
          <h2 className="add-emp-form-title">Add New Employee</h2>
          <p className="add-emp-form-subtitle">
            Fill in the details below to register a new employee
          </p>
        </div>

        <form onSubmit={handleSubmit} className="add-emp-form-body">
          {/* Profile Image Section */}
          <div className="add-emp-image-section">
            <div className="add-emp-image-container">
              <div className="add-emp-image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <ImageIcon size={40} />
                )}
              </div>
              <label htmlFor="profileImage" className="add-emp-upload-label">
                <Upload size={16} /> Upload Photo
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="add-emp-upload-input"
              />
            </div>
          </div>

          {/* Form Grid */}
          <div className="add-emp-form-grid">
            {/* Personal Details */}
            <FormGroup icon={<User size={16} />} label="Full Name">
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                required
                onChange={handleChange}
                value={formData.name}
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<Mail size={16} />} label="Email Address">
              <input
                type="email"
                name="email"
                placeholder="john@company.com"
                required
                onChange={handleChange}
                value={formData.email}
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<Lock size={16} />} label="Password">
              <input
                type="password"
                name="password"
                placeholder="Create password"
                required
                onChange={handleChange}
                value={formData.password}
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<Calendar size={16} />} label="Date of Birth">
              <input
                type="date"
                name="dob"
                onChange={handleChange}
                value={formData.dob}
                className="add-emp-form-input"
              />
            </FormGroup>

            {/* Professional Details */}
            <FormGroup icon={<Briefcase size={16} />} label="Role">
              <select
                name="role"
                onChange={handleChange}
                value={formData.role}
                required
                className="add-emp-form-select"
              >
                <option value="">Select Role</option>
                {/* Added Manager Option Below */}
                <option value="Manager">Manager</option>
                <option value="Sales">Sales</option>
                <option value="employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </FormGroup>

            <FormGroup icon={<Briefcase size={16} />} label="Designation">
              <input
                type="text"
                name="designation"
                onChange={handleChange}
                value={formData.designation}
                required
                placeholder="Enter Designation"
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<Calendar size={16} />} label="Joining Date">
              <input
                type="date"
                name="joiningDate"
                onChange={handleChange}
                value={formData.joiningDate}
                className="add-emp-form-input"
              />
            </FormGroup>

            {/* Documents */}
            <FormGroup icon={<FileText size={16} />} label="PAN Number">
              <input
                type="text"
                name="panNumber"
                placeholder="ABCDE1234F"
                onChange={handleChange}
                value={formData.panNumber}
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<FileText size={16} />} label="Aadhar Number">
              <input
                type="text"
                name="aadharNumber"
                placeholder="1234 5678 9012"
                onChange={handleChange}
                value={formData.aadharNumber}
                className="add-emp-form-input"
              />
            </FormGroup>
          </div>

          {/* Bank Details Divider */}
          <div className="add-emp-divider-section">
            <div className="add-emp-divider-line"></div>
            <span className="add-emp-divider-text">Bank Details</span>
            <div className="add-emp-divider-line"></div>
          </div>

          {/* Bank Details */}
          <div className="add-emp-bank-grid">
            <FormGroup icon={<Briefcase size={16} />} label="Bank Name">
              <input
                type="text"
                name="bankName"
                placeholder="HDFC Bank"
                onChange={handleChange}
                value={formData.bankName}
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<CreditCard size={16} />} label="Account Number">
              <input
                type="text"
                name="accountNumber"
                placeholder="Account No."
                onChange={handleChange}
                value={formData.accountNumber}
                className="add-emp-form-input"
              />
            </FormGroup>

            <FormGroup icon={<FileText size={16} />} label="IFSC Code">
              <input
                type="text"
                name="ifscCode"
                placeholder="HDFC0001234"
                onChange={handleChange}
                value={formData.ifscCode}
                className="add-emp-form-input"
              />
            </FormGroup>
          </div>

          {/* Submit Button */}
          <div className="add-emp-form-actions">
            <button
              type="submit"
              disabled={loading}
              className={`add-emp-btn-submit ${loading ? "loading" : ""}`}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Save Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper Component
const FormGroup = ({ icon, label, children }) => (
  <div className="add-emp-form-group">
    <label className="add-emp-form-label">
      {icon} {label}
    </label>
    {children}
  </div>
);

export default AddEmployee;