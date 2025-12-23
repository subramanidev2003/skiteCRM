import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, X, Phone, User, Briefcase, Calendar, 
  CreditCard, Activity, Tag, ClipboardCheck, MessageSquare 
} from 'lucide-react';
import { toast } from 'react-toastify';
import './LeadPageModern.css'; // ✅ Uses the Modern CSS

// --- MODERN EDITABLE ROW COMPONENT ---
const ActionRow = ({ label, icon: Icon, name, value, type = "text", options = [], onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onSave(name, tempValue);
    setIsEditing(false);
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
        <div className="editable-value-container" onClick={() => setIsEditing(true)}>
          <div className="value-pill">{value || 'Set Value'}</div>
        </div>
      )}
    </div>
  );
};

const LeadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentLead, setCurrentLead] = useState(location.state?.lead);
  
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [tempPriority, setTempPriority] = useState(currentLead?.priority);

  // Define Service Options
  const serviceOptions = [
    "Web Development", 
    "SEO", 
    "Paid Campaigns", 
    "Personal Branding", 
    "Full Digital Marketing"
  ];

  if (!currentLead) return null;

  const updateField = async (fieldName, newValue) => {
    try {
        const id = currentLead._id || currentLead.id;
        const updatedData = { ...currentLead, [fieldName]: newValue };

        const response = await fetch(`http://localhost:4000/api/leads/update/${id}`, {
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
            <div className="back-link" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Back
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
                    {currentLead.priority} Priority
                </span>
            )}
        </div>
      </header>

      {/* 2. GRID LAYOUT */}
      <div className="details-grid-layout">
        
        {/* LEFT COL: CLIENT PROFILE CARD */}
        <div className="info-card">
            <div className="card-heading">
                <User size={20} color="#ff7f50"/> Client Profile
            </div>
            
            <div className="info-list">
                <div className="info-row">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{currentLead.name}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Company</span>
                    <span className="info-value">{currentLead.companyName || 'N/A'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{currentLead.phoneNumber}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Business Type</span>
                    <span className="info-value">{currentLead.business || 'N/A'}</span>
                </div>
                 <div className="info-row">
                    <span className="info-label">Location</span>
                    <span className="info-value">{currentLead.location || 'N/A'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Date Added</span>
                    <span className="info-value">{currentLead.date}</span>
                </div>
            </div>
        </div>

        {/* RIGHT COL: ACTION CONSOLE */}
        <div className="info-card">
             <div className="card-heading">
                <Activity size={20} color="#ff7f50"/> Lead Console
            </div>

            <div className="action-list">
                
                {/* 1. Service Type */}
                <ActionRow 
                    label="Service Type" icon={Briefcase} name="serviceType" 
                    value={currentLead.serviceType} type="select" options={serviceOptions} onSave={updateField} 
                />
                
                {/* 2. Call Status */}
                <ActionRow 
                    label="Call Status" icon={Phone} name="callStatus" 
                    value={currentLead.callStatus} type="select" options={['Attend', 'Not Attend', 'Callback']} onSave={updateField} 
                />
                
                {/* 3. Follow Up Status */}
                <ActionRow 
                    label="Follow Up Status" icon={ClipboardCheck} name="followUpStatus" 
                    value={currentLead.followUpStatus} type="select" options={['Yes', 'No']} onSave={updateField} 
                />

                {/* 4. Lead Status */}
                <ActionRow 
                    label="Lead Status" icon={Tag} name="leadStatus" 
                    value={currentLead.leadStatus} type="select" options={['Okay', 'Not']} onSave={updateField} 
                />
                
                {/* 5. Callback Remainder */}
                <ActionRow 
                    label="Callback Remainder" icon={Calendar} name="callbackDate" 
                    value={currentLead.callbackDate} type="text" onSave={updateField} 
                />
                
                {/* 6. Remainder */}
                <ActionRow 
                    label="Remainder" icon={MessageSquare} name="requirement" 
                    value={currentLead.requirement} type="text" onSave={updateField} 
                />
                
                {/* 7. Payment */}
                <ActionRow 
                    label="Advance Payment" icon={CreditCard} name="payment" 
                    value={currentLead.payment} type="number" onSave={updateField} 
                />
                
                {/* 8. Closing */}
                <ActionRow 
                    label="Deal Closed?" icon={Check} name="closing" 
                    value={currentLead.closing} type="select" options={['Yes', 'No']} onSave={updateField} 
                />
            </div>
        </div>

      </div>

    </div>
  );
};

export default LeadPage;