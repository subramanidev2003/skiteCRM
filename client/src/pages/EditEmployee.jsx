import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, FileText, 
  CreditCard, ArrowLeft, Save, Upload, IndianRupee 
} from 'lucide-react';
import './EditEmployee.css';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';

// ✅ LIVE URL used here. Switch to localhost if testing locally.
// const API_BASE = 'https://skitecrm-1l7f.onrender.com/api'; 
const API_UPLOAD = `${API_BASE}/uploads`;

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    role: '',
    salaryPerDay: '', 
    dob: '',
    joiningDate: '',
    panNumber: '',
    aadharNumber: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    }
  });

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return navigate('/');

    try {
      const response = await fetch(`${API_BASE}/user/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        const formatDate = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
        
        setFormData({
          ...data,
          dob: formatDate(data.dob),
          joiningDate: formatDate(data.joiningDate),
          salaryPerDay: (data.salaryPerDay !== undefined && data.salaryPerDay !== null) ? data.salaryPerDay : '', 
          password: '', 
          bankDetails: data.bankDetails || { bankName: '', accountNumber: '', ifscCode: '' }
        });

        if (data.image) { 
          setImagePreview(`${API_UPLOAD}/${data.image}`);
        } else if (data.profileImage) {
           setImagePreview(`${API_UPLOAD}/${data.profileImage}`);
        }
      } else {
        toast.error('Failed to load employee data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const token = localStorage.getItem('adminToken');
    const dataToSend = new FormData();

    Object.keys(formData).forEach(key => {
      if (key !== 'bankDetails' && key !== 'image' && key !== '_id' && key !== 'profileImage') {
        if (key === 'password' && !formData[key]) {
          return; 
        }
        dataToSend.append(key, formData[key]);
      }
    });

    if (formData.salaryPerDay !== undefined) {
        dataToSend.set('salaryPerDay', formData.salaryPerDay); 
    }

    dataToSend.append('bankDetails', JSON.stringify(formData.bankDetails));

    if (selectedFile) {
      dataToSend.append('image', selectedFile); 
    } 

    try {
      const response = await fetch(`${API_BASE}/user/edit/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dataToSend
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Employee updated successfully!');
        navigate(-1);
      } else {
        toast.error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update Error:', error);
      toast.error('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (loading) return <div className="ee-container"><p>Loading...</p></div>;

  return (
    <div className="ee-container">
      <div className="ee-wrapper">
        
        {/* Header */}
        <div className="ee-header">
          <button className="ee-back-btn" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={20} /> Back
          </button>
          <h2 className="ee-title">Edit Employee</h2>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Image Upload */}
          <div className="ee-profile-section">
            <div className="ee-image-wrapper">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="ee-image-preview" />
              ) : (
                <div className="ee-image-placeholder"><User size={40} /></div>
              )}
              <label htmlFor="imageUpload" className="ee-upload-overlay">
                <Upload size={14} /> Upload
              </label>
              <input 
                type="file" 
                id="imageUpload" 
                hidden 
                onChange={handleImageChange} 
                accept="image/*"
              />
            </div>
          </div>

          {/* Form Grid - Responsive */}
          <div className="ee-grid-container">
            
            {/* Card 1: Personal */}
            <div className="ee-card">
              <h3 className="ee-card-title"><User size={18} /> Personal Info</h3>
              <div className="ee-form-group">
                <label>Full Name</label>
                <input className="ee-input" type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="ee-form-group">
                <label>Email</label>
                <input className="ee-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="ee-form-group">
                <label>Date of Birth</label>
                <input className="ee-input" type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
            </div>

            {/* Card 2: Professional */}
            <div className="ee-card">
              <h3 className="ee-card-title"><Briefcase size={18} /> Professional</h3>
              <div className="ee-form-group">
                <label>Designation</label>
                <input className="ee-input" type="text" name="designation" value={formData.designation} onChange={handleChange} />
              </div>
              <div className="ee-form-group">
                <label>Role</label>
                <select className="ee-select" name="role" value={formData.role} onChange={handleChange}>
                  <option value="employee">Employee</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="ee-form-group">
                <label>Joining Date</label>
                <input className="ee-input" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
              </div>
              
              {/* Salary - Fixed Scroll Issue */}
              <div className="ee-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IndianRupee size={14} /> Salary Per Day
                </label>
                <input 
                  className="ee-input"
                  type="number" 
                  name="salaryPerDay" 
                  value={formData.salaryPerDay} 
                  onChange={handleChange} 
                  placeholder="e.g. 500"
                  onWheel={(e) => e.target.blur()} 
                />
              </div>
            </div>

            {/* Card 3: Documents */}
            <div className="ee-card">
              <h3 className="ee-card-title"><FileText size={18} /> Documents</h3>
              <div className="ee-form-group">
                <label>PAN Number</label>
                <input className="ee-input" type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} />
              </div>
              <div className="ee-form-group">
                <label>Aadhar Number</label>
                <input className="ee-input" type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} />
              </div>
              <div className="ee-form-group">
                <label>Password (Leave empty to keep)</label>
                <input 
                  className="ee-input"
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
              </div>
            </div>

            {/* Card 4: Bank Details */}
            <div className="ee-card">
              <h3 className="ee-card-title"><CreditCard size={18} /> Bank Details</h3>
              <div className="ee-form-group">
                <label>Bank Name</label>
                <input className="ee-input" type="text" name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} />
              </div>
              <div className="ee-form-group">
                <label>Account Number</label>
                <input className="ee-input" type="text" name="accountNumber" value={formData.bankDetails.accountNumber} onChange={handleBankChange} />
              </div>
              <div className="ee-form-group">
                <label>IFSC Code</label>
                <input className="ee-input" type="text" name="ifscCode" value={formData.bankDetails.ifscCode} onChange={handleBankChange} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ee-actions">
            <button type="submit" className="ee-save-btn" disabled={saving}>
              {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;