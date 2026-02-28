import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, Trash2, Edit2, Check, Globe, Phone, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';
import './SocialMedia.css'; 

const WebDevProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [client, setClient] = useState(null);
    const [items, setItems] = useState([]); 
    const [developers, setDevelopers] = useState([]);
    
    // Inputs
    const [reqInput, setReqInput] = useState('');
    const [changeInput, setChangeInput] = useState('');

    // ✅ EDIT STATE
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        if(id) {
            fetchClientData();
            fetchItems();
            fetchDevelopers();
        }
    }, [id]);

    const fetchClientData = async () => {
        try {
            const res = await fetch(`${API_BASE}/webdev/client/${id}`);
            if(res.ok) {
                const data = await res.json();
                setClient(data);
                // Initialize edit data
                setEditData({
                    clientName: data.clientName || '',
                    businessName: data.businessName || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    website: data.website || '',
                    assignedDev: data.assignedDev?._id || data.assignedDev || ''
                });
            }
        } catch(err) { console.error(err); }
    };

    const fetchItems = async () => {
        try {
            const res = await fetch(`${API_BASE}/webdev/requirements/${id}`);
            if(res.ok) setItems(await res.json());
        } catch(err) { console.error(err); }
    };

    const fetchDevelopers = async () => {
        try {
            const res = await fetch(`${API_BASE}/content/users/developer`); 
            if(res.ok) setDevelopers(await res.json());
        } catch(err) { console.error(err); }
    };

    // ✅ SAVE EDITED CLIENT DETAILS
    const handleSaveClientDetails = async () => {
        try {
            const res = await fetch(`${API_BASE}/webdev/client/update/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(editData)
            });
            if(res.ok) {
                toast.success("Client details updated!");
                setIsEditing(false);
                fetchClientData(); // Refresh data
            } else {
                toast.error("Failed to update details");
            }
        } catch(err) { toast.error("Error updating details"); }
    };

    // ✅ ADD ITEM (Requirement / Change)
    const handleAddItem = async (type, description, setInput) => {
        if(!description) return toast.warning("Enter description!");
        
        if(!editData.assignedDev) {
            return toast.error("Please assign a developer to this project first!");
        }
        
        const fullDescription = `[${client.businessName}] - ${description}`;

        try {
            const res = await fetch(`${API_BASE}/webdev/requirements/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    clientId: id, 
                    type, 
                    description: fullDescription, 
                    assignedTo: editData.assignedDev 
                })
            });
            if(res.ok) {
                toast.success(`${type} Added & Assigned to Developer!`);
                setInput('');
                fetchItems();
            }
        } catch(err) { toast.error("Error adding item"); }
    };

    const handleDeleteItem = async (itemId) => {
        if(window.confirm("Are you sure you want to delete this item?")) {
            try {
                const res = await fetch(`${API_BASE}/webdev/requirements/delete/${itemId}`, { method: 'DELETE' });
                if(res.ok) {
                    toast.success("Item Deleted");
                    fetchItems(); 
                }
            } catch(err) { toast.error("Error deleting item"); }
        }
    };

    const updateClientStatus = async (field, value) => {
        try {
            const res = await fetch(`${API_BASE}/webdev/client/update/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ [field]: value })
            });
            if(res.ok) {
                setClient(prev => ({ ...prev, [field]: value }));
                toast.success("Updated successfully");
            }
        } catch(err) { toast.error("Update failed"); }
    };

    // Helper to format date for input field
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const requirements = items.filter(i => i.type === 'Requirement');
    const changes = items.filter(i => i.type === 'Change');

    if(!client) return <div style={{padding:'20px'}}>Loading...</div>;

    return (
        <div className="admin-dashboard">
            <main className="main-content-child" style={{padding:'30px'}}>
                
                {/* ✅ TOP HEADER & CLIENT DETAILS */}
                <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px'}}>
                    
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                            <button onClick={()=>navigate('/webdev/clients')} className="modern-back-btn"><ArrowLeft size={20}/> Back</button>
                            <div>
                                {isEditing ? (
                                    <input className="edit-input" value={editData.businessName} onChange={e=>setEditData({...editData, businessName: e.target.value})} style={{fontSize: '24px', fontWeight: 'bold', width: '100%', marginBottom:'5px'}} />
                                ) : (
                                    <h1 style={{margin:0, fontSize:'24px', color:'#FF4500'}}>{client.businessName}</h1>
                                )}
                            </div>
                        </div>

                        {/* Edit Button */}
                        <div>
                            {isEditing ? (
                                <button onClick={handleSaveClientDetails} className="btn-primary" style={{background: '#10b981', display:'flex', gap:'5px', alignItems:'center'}}>
                                    <Check size={16}/> Save Details
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn-primary" style={{background: '#3b82f6', display:'flex', gap:'5px', alignItems:'center'}}>
                                    <Edit2 size={16}/> Edit Details
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Client Info Grid */}
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
                        
                        <div>
                            <label style={{fontSize: '12px', color: '#888', fontWeight: 'bold'}}>Client Name</label>
                            {isEditing ? <input className="edit-input" value={editData.clientName} onChange={e=>setEditData({...editData, clientName: e.target.value})} /> 
                            : <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'5px'}}><User size={16} color="#555"/> {client.clientName}</div>}
                        </div>

                        <div>
                            <label style={{fontSize: '12px', color: '#888', fontWeight: 'bold'}}>Phone</label>
                            {isEditing ? <input className="edit-input" value={editData.phone} onChange={e=>setEditData({...editData, phone: e.target.value})} /> 
                            : <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'5px'}}><Phone size={16} color="#555"/> {client.phone || 'N/A'}</div>}
                        </div>

                        <div>
                            <label style={{fontSize: '12px', color: '#888', fontWeight: 'bold'}}>Email</label>
                            {isEditing ? <input className="edit-input" value={editData.email} onChange={e=>setEditData({...editData, email: e.target.value})} /> 
                            : <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'5px'}}><Mail size={16} color="#555"/> {client.email || 'N/A'}</div>}
                        </div>

                        <div>
                            <label style={{fontSize: '12px', color: '#888', fontWeight: 'bold'}}>Website</label>
                            {isEditing ? <input className="edit-input" value={editData.website} onChange={e=>setEditData({...editData, website: e.target.value})} /> 
                            : <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'5px'}}><Globe size={16} color="#3b82f6"/> 
                                {client.website ? <a href={`https://${client.website.replace('https://', '')}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', textDecoration:'none'}}>{client.website}</a> : 'N/A'}
                              </div>}
                        </div>

                        <div>
                            <label style={{fontSize: '12px', color: '#FF4500', fontWeight: 'bold'}}>Assigned Developer</label>
                            {isEditing ? (
                                <select 
                                    value={editData.assignedDev} 
                                    onChange={e => setEditData({...editData, assignedDev: e.target.value})}
                                    style={{width:'100%', padding:'8px', border:'1px solid #FF4500', borderRadius:'6px', marginTop:'5px'}}
                                >
                                    <option value="">-- Select Developer --</option>
                                    {developers.map(dev => <option key={dev._id} value={dev._id}>{dev.name}</option>)}
                                </select>
                            ) : (
                                <div style={{marginTop:'5px', fontWeight:'bold', color: client.assignedDev ? '#10b981' : '#dc2626'}}>
                                    {developers.find(d => d._id === (client.assignedDev?._id || client.assignedDev))?.name || 'Not Assigned'}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* 2 Columns: Requirements & Changes */}
                <div style={{display:'flex', gap:'20px', minHeight:'40vh', flexWrap:'wrap'}}>
                    
                    {/* Left: Requirements */}
                    <div style={{flex:1, minWidth:'300px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                        <h3 style={{marginTop:0, borderBottom:'2px solid #FF4500', display:'inline-block', paddingBottom:'5px', color:'#333'}}>Requirements</h3>
                        
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                            <input 
                                type="text" 
                                placeholder="Add new requirement..." 
                                style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:'5px'}}
                                value={reqInput}
                                onChange={e=>setReqInput(e.target.value)}
                            />
                            <button className="btn-primary" onClick={()=>handleAddItem('Requirement', reqInput, setReqInput)}><Plus size={18}/></button>
                        </div>

                        <div className="item-list">
                            {requirements.map(item => (
                                <div key={item._id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div>
                                        <div style={{fontWeight:'500', fontSize:'14px', marginBottom:'4px'}}>{item.description}</div>
                                        <div style={{fontSize:'12px', color:'#888', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <User size={12}/> {item.assignedTo?.name || 'Unassigned'}
                                        </div>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <div className={`status-pill ${item.assignedTaskId?.status === 'Completed' ? 'completed' : 'pending'}`}>
                                            {item.assignedTaskId?.status === 'Completed' ? 'Completed' : 'Pending'}
                                        </div>
                                        <button onClick={() => handleDeleteItem(item._id)} style={{background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#dc2626'}}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {requirements.length === 0 && <div style={{textAlign:'center', color:'#999', fontSize:'13px', padding:'20px'}}>No requirements.</div>}
                        </div>
                    </div>

                    {/* Right: Changes */}
                    <div style={{flex:1, minWidth:'300px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                        <h3 style={{marginTop:0, borderBottom:'2px solid #3b82f6', display:'inline-block', paddingBottom:'5px', color:'#333'}}>Changes</h3>
                        
                        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                            <input 
                                type="text" 
                                placeholder="Add new change..." 
                                style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:'5px'}}
                                value={changeInput}
                                onChange={e=>setChangeInput(e.target.value)}
                            />
                            <button className="btn-primary" style={{background:'#3b82f6'}} onClick={()=>handleAddItem('Change', changeInput, setChangeInput)}><Plus size={18}/></button>
                        </div>

                        <div className="item-list">
                            {changes.map(item => (
                                <div key={item._id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div>
                                        <div style={{fontWeight:'500', fontSize:'14px', marginBottom:'4px'}}>{item.description}</div>
                                        <div style={{fontSize:'12px', color:'#888', display:'flex', alignItems:'center', gap:'5px'}}>
                                            <User size={12}/> {item.assignedTo?.name || 'Unassigned'}
                                        </div>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <div className={`status-pill ${item.assignedTaskId?.status === 'Completed' ? 'completed' : 'pending'}`}>
                                            {item.assignedTaskId?.status === 'Completed' ? 'Completed' : 'Pending'}
                                        </div>
                                        <button onClick={() => handleDeleteItem(item._id)} style={{background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#dc2626'}}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {changes.length === 0 && <div style={{textAlign:'center', color:'#999', fontSize:'13px', padding:'20px'}}>No changes requested.</div>}
                        </div>
                    </div>
                </div>

                {/* Bottom: Client Status & Dates */}
                <div style={{marginTop:'30px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                    <h3 style={{marginTop:0, color:'#333'}}>Project Status Control</h3>
                    
                    {/* Status Dropdowns */}
                    <div style={{display:'flex', justifyContent:'space-around', gap:'20px', padding:'20px', background:'#f9fafb', borderRadius:'8px', flexWrap:'wrap', marginBottom: '20px'}}>
                        <div style={{textAlign:'center', flex:1, minWidth:'200px'}}>
                            <label style={{display:'block', marginBottom:'10px', fontWeight:'600', color:'#555'}}>Client Status</label>
                            <select 
                                value={client.clientStatus} 
                                onChange={e=>updateClientStatus('clientStatus', e.target.value)}
                                style={{width:'80%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Onboarding">Onboarding</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div style={{textAlign:'center', flex:1, minWidth:'200px'}}>
                            <label style={{display:'block', marginBottom:'10px', fontWeight:'600', color:'#555'}}>Project Status</label>
                             <select 
                                value={client.projectStatus} 
                                onChange={e=>updateClientStatus('projectStatus', e.target.value)}
                                style={{width:'80%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}}
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Testing">Testing</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* ✅ NEW: Project Dates Section */}
                    <h4 style={{color:'#555', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Timeline & Payments</h4>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', padding:'20px', background:'#f9fafb', borderRadius:'8px'}}>
                        
                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600', color:'#555'}}>Start Date</label>
                            <input 
                                type="date" 
                                value={formatDateForInput(client.startDate)} 
                                onChange={e => updateClientStatus('startDate', e.target.value)}
                                style={{width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd', color: '#333'}}
                            />
                        </div>

                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600', color:'#555'}}>End Date</label>
                            <input 
                                type="date" 
                                value={formatDateForInput(client.endDate)} 
                                onChange={e => updateClientStatus('endDate', e.target.value)}
                                style={{width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd', color: '#333'}}
                            />
                        </div>

                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600', color:'#555'}}>Advance Payment Date</label>
                            <input 
                                type="date" 
                                value={formatDateForInput(client.advancePaymentDate)} 
                                onChange={e => updateClientStatus('advancePaymentDate', e.target.value)}
                                style={{width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd', color: '#333'}}
                            />
                        </div>

                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'600', color:'#555'}}>Full Payment Date</label>
                            <input 
                                type="date" 
                                value={formatDateForInput(client.fullPaymentDate)} 
                                onChange={e => updateClientStatus('fullPaymentDate', e.target.value)}
                                style={{width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd', color: '#333'}}
                            />
                        </div>

                    </div>
                    {/* End of Timeline */}

                </div>

            </main>
        </div>
    );
};

export default WebDevProject;