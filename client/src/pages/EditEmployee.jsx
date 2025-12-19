import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Briefcase, FileText, 
  CreditCard, Building, ArrowLeft, Save, Upload, X 
} from 'lucide-react';
import './EditEmployee.css';
import { toast } from 'react-toastify';

const API_BASE = 'https://skitecrm.onrender.com/api';
const API_UPLOAD = 'https://skitecrm.onrender.com/api/uploads';

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
        password: '', // Don't populate password field
        bankDetails: data.bankDetails || { bankName: '', accountNumber: '', ifscCode: '' }
      });

      // Store the profileImage in formData
      if (data.profileImage) {
        setFormData(prev => ({
          ...prev,
          profileImage: data.profileImage
        }));
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      console.log('Image selected:', file.name, file.type, file.size);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  
  const token = localStorage.getItem('adminToken');
  const dataToSend = new FormData();

  // 1. Append basic fields
  Object.keys(formData).forEach(key => {
    // CRITICAL: Keep profileImage in the excluded list
    if (key !== 'bankDetails' && key !== 'image' && key !== '_id' && key !== 'profileImage') {
      
      // Skip password if it is empty
      if (key === 'password' && !formData[key]) {
        return; 
      }
      dataToSend.append(key, formData[key]);
    }
  });

  // 2. Append Bank Details as JSON string
  dataToSend.append('bankDetails', JSON.stringify(formData.bankDetails));

  // 3. Append Image ONLY if a new one is selected
  if (selectedFile) {
    dataToSend.append('image', selectedFile); 
  } else {
    // CRITICAL FIX: If no new file selected, send existing image filename
    // Get the existing profileImage from the original data
    const existingImage = formData.profileImage;
    if (existingImage && existingImage !== 'null' && existingImage !== 'undefined') {
      // Extract just the filename if it's a full URL
      const filename = existingImage.includes('/') 
        ? existingImage.split('/').pop() 
        : existingImage;
      dataToSend.append('profileImage', filename);
    }
  }

  try {
    const response = await fetch(`${API_BASE}/user/edit/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type manually
      },
      body: dataToSend
    });

    const result = await response.json();

    if (response.ok) {
      toast.success('Employee updated successfully!');
      navigate(`/admin-dashboard/teams/details/${id}`);
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
  // Clean up image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (loading) return <div className="loading-text">Loading...</div>;

  return (
    <div className="details-container1">
      <div className="details-wrapper1">
        
        <div className="details-header">
          <button className="back-btn" onClick={() => navigate(-1)} type="button">
            <ArrowLeft size={20} /> Cancel
          </button>
          <h2 className="header-title">Edit Employee</h2>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          
          <div className="profile-edit-section">
            <div className="image-preview-wrapper">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-placeholder"><User size={40} /></div>
              )}
              <label htmlFor="imageUpload" className="upload-btn-overlay">
                <Upload size={16} /> Change Photo
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

          <div className="details-grid">
            
            <div className="detail-card">
              <h3 className="card-title"><User size={18} /> Personal Info</h3>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
            </div>

            <div className="detail-card">
              <h3 className="card-title"><Briefcase size={18} /> Professional</h3>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="form-select">
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Joining Date</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
              </div>
            </div>

            <div className="detail-card">
              <h3 className="card-title"><FileText size={18} /> Documents</h3>
              <div className="form-group">
                <label>PAN Number</label>
                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Aadhar Number</label>
                <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Password (Leave empty to keep current)</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="Enter new password or leave empty"
                />
              </div>
            </div>

            <div className="detail-card">
              <h3 className="card-title"><CreditCard size={18} /> Bank Details</h3>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" name="accountNumber" value={formData.bankDetails.accountNumber} onChange={handleBankChange} />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.bankDetails.ifscCode} onChange={handleBankChange} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;