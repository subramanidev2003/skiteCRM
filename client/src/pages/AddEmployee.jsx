import React, { useState } from 'react';
import { 
  User, Mail, Lock, Briefcase, Calendar, 
  CreditCard, FileText, Upload, Save, ArrowLeft, Image as ImageIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    
    // Append all fields exactly as backend expects
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

    // Append Image with correct field name that matches multer config
    if (formData.profileImage) {
      dataToSend.append('image', formData.profileImage); // Changed from 'profileImage' to 'image'
    }

    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        body: dataToSend
      });

      const data = await response.json();
      
      // Enhanced error logging
      console.log('Response Status:', response.status);
      console.log('Response Data:', data);

      if (response.ok) {
        alert('Employee Added Successfully!');
        // Reset form
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
        // Show specific error message from backend
        const errorMsg = data.message || data.msg || 'Failed to add employee';
        alert(`Error: ${errorMsg}`);
        console.error('Backend Error:', data);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Network Error: Could not connect to server. Make sure backend is running on port 4000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffffffff 0%, #ffffffff 100%)",
        padding: "2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <button
        className="btn-primary1"
        onClick={() => navigate("/admin-dashboard")}
      >
        <ArrowLeft size={20} /> Back To Dashboard
      </button>
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #ff4500 0%, #ffffffff 100%)",
            padding: "2rem",
            color: "white",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "600" }}>
            Add New Employee
          </h2>
          <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9 }}>
            Fill in the details below to register a new employee
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
          {/* Profile Image Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "2rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  border: "4px solid #ff4500",
                  overflow: "hidden",
                  margin: "0 auto 1rem",
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <ImageIcon size={40} color="#cbd5e1" />
                )}
              </div>
              <label
                htmlFor="profileImage"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "#ff4500",
                  color: "white",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }}
              >
                <Upload size={16} /> Upload Photo
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Form Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Personal Details */}
            <FormGroup icon={<User size={16} />} label="Full Name">
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                required
                onChange={handleChange}
                value={formData.name}
                style={inputStyle}
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
                style={inputStyle}
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
                style={inputStyle}
              />
            </FormGroup>

            <FormGroup icon={<Calendar size={16} />} label="Date of Birth">
              <input
                type="date"
                name="dob"
                onChange={handleChange}
                value={formData.dob}
                style={inputStyle}
              />
            </FormGroup>

            {/* Professional Details */}
            <FormGroup icon={<Briefcase size={16} />} label="Role">
              <select
                name="role"
                onChange={handleChange}
                value={formData.role}
                style={inputStyle}
              >
                <option value="">Select Role</option>
                <option value="employee">Employee</option>
                <option value="Admin">Admin</option>
              </select>
            </FormGroup>

            <FormGroup icon={<Briefcase size={16} />} label="Designation">
              <input
                type="text" // <-- Changed the element type
                name="designation"
                onChange={handleChange}
                value={formData.designation}
                required
                placeholder="Enter Designation" // Added a placeholder for better UX
                style={inputStyle}
              />
            </FormGroup>
            <FormGroup icon={<Calendar size={16} />} label="Joining Date">
              <input
                type="date"
                name="joiningDate"
                onChange={handleChange}
                value={formData.joiningDate}
                style={inputStyle}
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
                style={inputStyle}
              />
            </FormGroup>

            <FormGroup icon={<FileText size={16} />} label="Aadhar Number">
              <input
                type="text"
                name="aadharNumber"
                placeholder="1234 5678 9012"
                onChange={handleChange}
                value={formData.aadharNumber}
                style={inputStyle}
              />
            </FormGroup>
          </div>

          {/* Bank Details Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "2rem 0 1.5rem",
              gap: "1rem",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "#e2e8f0" }}
            ></div>
            <span style={{ color: "#64748b", fontWeight: "600" }}>
              Bank Details
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "#e2e8f0" }}
            ></div>
          </div>

          {/* Bank Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <FormGroup icon={<Briefcase size={16} />} label="Bank Name">
              <input
                type="text"
                name="bankName"
                placeholder="HDFC Bank"
                onChange={handleChange}
                value={formData.bankName}
                style={inputStyle}
              />
            </FormGroup>

            <FormGroup icon={<CreditCard size={16} />} label="Account Number">
              <input
                type="text"
                name="accountNumber"
                placeholder="Account No."
                onChange={handleChange}
                value={formData.accountNumber}
                style={inputStyle}
              />
            </FormGroup>

            <FormGroup icon={<FileText size={16} />} label="IFSC Code">
              <input
                type="text"
                name="ifscCode"
                placeholder="HDFC0001234"
                onChange={handleChange}
                value={formData.ifscCode}
                style={inputStyle}
              />
            </FormGroup>
          </div>

          {/* Submit Button */}
          <div
            style={{ display: "flex", justifyContent: "center", gap: "1rem" }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 2rem",
                background: loading
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #9238d3ff 0%, #ff4500 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "transform 0.2s",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              }}
              onMouseOver={(e) =>
                !loading && (e.target.style.transform = "translateY(-2px)")
              }
              onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
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
  <div>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem',
      color: '#475569',
      fontSize: '0.9rem',
      fontWeight: '500'
    }}>
      {icon} {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '2px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '0.95rem',
  transition: 'all 0.2s',
  outline: 'none',
  fontFamily: 'inherit'
};

export default AddEmployee;