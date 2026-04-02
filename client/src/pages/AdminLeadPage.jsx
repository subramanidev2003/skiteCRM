import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, X, Phone, User, Briefcase, MapPin, Calendar, 
  CreditCard, Activity, Tag, ClipboardCheck, MessageSquare, Lock, Mail, Link, ShoppingCart 
} from 'lucide-react'; // ✅ Added ShoppingCart & Link
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './LeadPageModern.css'; 

// --- ACTION ROW COMPONENT (EDITABLE FIELD) ---
const ActionRow = ({ label, icon: Icon, name, value, type = "text", options = [], onSave, colorClass = "", disabled = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onSave(name, tempValue);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (!disabled) {
      setTempValue(value); 
      setIsEditing(true);
    } else {
      toast.info("This field is locked.");
    }
  };

  const renderValue = () => {
    if (!value) return <span style={{opacity: 0.5, fontStyle: 'italic'}}>Set Value</span>;
    
    if (type === 'url') {
      const href = value.startsWith('http') ? value : `https://${value}`;
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={(e) => e.stopPropagation()} 
          style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {value}
        </a>
      );
    }

    return value;
  };

  return (
    <div className="action-row">
      <div className="row-label">
        {Icon && <Icon size={18} color="#9ca3af" />}
        <span>{label}</span>
      </div>

      {isEditing ? (
        <div className="edit-actions">
          {type === 'select' ? (
            <select className="modern-select" value={tempValue} onChange={(e) => setTempValue(e.target.value)}>
               <option value="" disabled>Select...</option>
               {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input type={type} className="modern-input" value={tempValue || ''} onChange={(e) => setTempValue(e.target.value)} />
          )}
          <button className="action-btn save-btn" onClick={handleSave}><Check size={16} /></button>
          <button className="action-btn cancel-btn" onClick={() => { setIsEditing(false); setTempValue(value); }}><X size={16} /></button>
        </div>
      ) : (
        <div 
            className={`editable-value-container ${disabled ? 'disabled' : ''}`} 
            onClick={handleEditClick}
            title={disabled ? "Locked" : "Click to Edit"}
        >
          <div className={`value-pill ${colorClass}`}>
            {renderValue()}
          </div>
          {disabled && <Lock size={14} className="lock-icon" />}
        </div>
      )}
    </div>
  );
};

const AdminLeadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentLead, setCurrentLead] = useState(location.state?.lead);
   const storedUser = JSON.parse(
    localStorage.getItem("adminUser") || 
    localStorage.getItem("managerUser") || 
    localStorage.getItem("userData") || '{}'
  );
  const isManager = storedUser?.role?.toLowerCase() === 'manager';
  const handleBack = () => {
    if (isManager) navigate('/admin-dashboard/leads');
    else navigate(-1);
  };
  
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [tempPriority, setTempPriority] = useState(currentLead?.priority);

  const serviceOptions = [
    "Web Development", "SEO", "Paid Campaigns", "Personal Branding", "Full Digital Marketing"
  ];

  if (!currentLead) return null;

  // --- HELPER: DETERMINE COLOR ---
  const getStatusColor = (val) => {
    if (!val) return '';
    const v = val.toLowerCase();
    if (v === 'attend' || v === 'yes' || v === 'okay' || v === 'open') return 'green';
    if (v === 'not attend' || v === 'no' || v === 'not' || v === 'rejected') return 'red';
    if (v === 'callback' || v === 'closed') return 'blue';
    return '';
  };

  // ✅ LOGIC UPDATED EXACTLY LIKE LeadPage.js
  const isPaymentUnlocked = 
    currentLead.callStatus === 'Attend' && 
    currentLead.followUpStatus === 'Yes';

  const updateField = async (fieldName, newValue) => {
    try {
        const id = currentLead._id || currentLead.id;
        const updatedData = { ...currentLead, [fieldName]: newValue };

        const response = await fetch(`${API_BASE}/leads/update/${id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(updatedData)
        });

        const data = await response.json();
        if(response.ok) {
            setCurrentLead(data.lead);
            toast.success(`${fieldName} updated`);
        } else {
            toast.error(data.message);
        }
    } catch(err) { toast.error("Server Error"); }
  };

  const savePriority = () => {
    updateField('priority', tempPriority);
    setIsEditingPriority(false);
  };

  return (
    <div className="modern-container">
      
      {/* 1. HEADER */}
      <header className="modern-header">
        <div>
            <div className="back-link" onClick={handleBack}>
            <ArrowLeft size={18} /> Back to Dashboard
          </div>
        </div>
        
        <div className="header-content">
            <h1 className="lead-title">{currentLead.name}</h1>
            
            {isEditingPriority ? (
                <div className="edit-actions">
                    <select className="modern-select" style={{padding: '4px', minWidth: '100px'}} value={tempPriority} onChange={(e) => setTempPriority(e.target.value)}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <button className="action-btn save-btn" onClick={savePriority}><Check size={14} /></button>
                    <button className="action-btn cancel-btn" onClick={() => setIsEditingPriority(false)}><X size={14} /></button>
                </div>
            ) : (
                <span 
                    className={`badge-priority ${currentLead.priority?.toLowerCase()}`} 
                    onClick={() => setIsEditingPriority(true)}
                    title="Click to edit priority"
                >
                    {currentLead.priority || 'Medium'} Priority
                </span>
            )}
        </div>
      </header>

      {/* 2. GRID LAYOUT */}
      <div className="details-grid-layout">
        
        {/* LEFT COL: CLIENT PROFILE */}
        <div className="info-card">
            <div className="card-heading">
                <User size={20} color="#ff7f50"/> Client Profile
            </div>
            
            <div className="action-list">
                
                <ActionRow 
                    label="Full Name" icon={User} name="name" 
                    value={currentLead.name} type="text" onSave={updateField} 
                />

                <ActionRow 
                    label="Email" icon={Mail} name="email" 
                    value={currentLead.email} type="email" onSave={updateField} 
                />

                <ActionRow 
                    label="Company" icon={Briefcase} name="companyName" 
                    value={currentLead.companyName} type="text" onSave={updateField} 
                />

                <ActionRow 
                    label="Website" icon={Link} name="website" 
                    value={currentLead.website} type="url" onSave={updateField} 
                />

                <ActionRow 
                    label="Phone" icon={Phone} name="phoneNumber" 
                    value={currentLead.phoneNumber} type="tel" onSave={updateField} 
                />

                <ActionRow 
                    label="Business Type" icon={Activity} name="business" 
                    value={currentLead.business} type="text" onSave={updateField} 
                />

                 <ActionRow 
                    label="Location" icon={MapPin} name="location" 
                    value={currentLead.location} type="text" onSave={updateField} 
                />

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '12px 0', borderBottom: '1px solid #f3f4f6', fontSize: '14px'
                }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: '#9ca3af'}}>
                        <Calendar size={18} />
                        <span>Date Added</span>
                    </div>
                    <span style={{fontWeight: '500', color: '#374151'}}>
                        {currentLead.date ? new Date(currentLead.date).toLocaleDateString() : 'N/A'}
                    </span>
                </div>

            </div>
        </div>

        {/* RIGHT COL: LEAD CONSOLE */}
        <div className="info-card">
              <div className="card-heading">
                <Activity size={20} color="#ff7f50"/> Lead Console
            </div>

            <div className="action-list">
                
                <ActionRow 
                    label="Service Type" icon={Briefcase} name="serviceType" 
                    value={currentLead.serviceType} type="select" options={serviceOptions} onSave={updateField} 
                />
                
                <ActionRow 
                    label="Call Status" icon={Phone} name="callStatus" 
                    value={currentLead.callStatus} 
                    type="select" options={['Attend', 'Not Attend', 'Callback']} 
                    onSave={updateField} 
                    colorClass={getStatusColor(currentLead.callStatus)} 
                />
                
                <ActionRow 
                    label="Follow Up Status" icon={ClipboardCheck} name="followUpStatus" 
                    value={currentLead.followUpStatus} 
                    type="select" options={['Yes', 'No']} 
                    onSave={updateField} 
                    colorClass={getStatusColor(currentLead.followUpStatus)}
                />

                {/* ✅ Follow Up Responsibility instead of Lead Status */}
                <ActionRow 
                    label="Follow Up Responsibility" icon={User} name="followUpResponsibility" 
                    value={currentLead.followUpResponsibility} 
                    type="select" options={['teleSales', 'sasi prakash']} 
                    onSave={updateField} 
                />

                {/* ✅ Order Status */}
                <ActionRow 
                    label="Order Status" icon={ShoppingCart} name="orderStatus" 
                    value={currentLead.orderStatus} 
                    type="select" options={['Open', 'Closed', 'Rejected']} 
                    onSave={updateField} 
                    colorClass={getStatusColor(currentLead.orderStatus)}
                />
                
                <ActionRow 
                    label="Remainder" icon={MessageSquare} name="requirement" 
                    value={currentLead.requirement} type="text" onSave={updateField} 
                />

                {/* ✅ Remainder 2 Field added */}
                <ActionRow 
                    label="Remainder 2" icon={MessageSquare} name="remainder2" 
                    value={currentLead.remainder2} type="text" onSave={updateField} 
                />

                 <ActionRow 
                    label="Advance Payment" icon={CreditCard} name="payment" 
                    value={currentLead.payment} type="number" onSave={updateField}
                    colorClass="green"
                />
                
                <div style={{margin: '15px 0', borderTop: '1px dashed #e5e7eb'}}></div>
                
                <ActionRow 
                    label="Deal Closed?" icon={Check} name="closing" 
                    value={currentLead.closing} type="select" options={['Yes', 'No']} onSave={updateField} 
                    colorClass={getStatusColor(currentLead.closing)}
                    disabled={!isPaymentUnlocked}
                />

            </div>
        </div>

      </div>

    </div>
  );
};

export default AdminLeadPage;