import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, Trash2, Edit2, Check, Search, Phone, Mail, Globe, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE } from '../api';

const SEOProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [client, setClient] = useState(null);
    const [items, setItems] = useState([]); 
    const [specialists, setSpecialists] = useState([]);
    
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
            fetchSpecialists();
        }
    }, [id]);

    const fetchClientData = async () => {
        try {
            const res = await fetch(`${API_BASE}/seo/client/${id}`);
            if(res.ok) {
                const data = await res.json();
                setClient(data);
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
            const res = await fetch(`${API_BASE}/seo/requirements/${id}`);
            if(res.ok) setItems(await res.json());
        } catch(err) { console.error(err); }
    };

const fetchSpecialists = async () => {
    try {
        // ✅ Maathiyaachu: Ippo '/content/users/seo' endpoint-ah hit pannum
        const res = await fetch(`${API_BASE}/content/users/seo`); 
        if(res.ok) {
            const data = await res.json();
            setSpecialists(data); // Ippo SEO specialists mattum dhaan dropdown-la varuvaanga
        }
    } catch(err) { 
        console.error("Error fetching SEO staff:", err); 
    }
};

    const handleSaveClientDetails = async () => {
        try {
            const res = await fetch(`${API_BASE}/seo/client/update/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(editData)
            });
            if(res.ok) {
                toast.success("SEO Client details updated!");
                setIsEditing(false);
                fetchClientData();
            }
        } catch(err) { toast.error("Update failed"); }
    };

    const handleAddItem = async (type, description, setInput) => {
        if(!description) return toast.warning("Enter description!");
        if(!editData.assignedDev) {
            return toast.error("Please assign an SEO Specialist first!");
        }
        
        // WebDev maadhiriye clear title
        const fullDescription = `[SEO - ${client.businessName}] - ${description}`;
        
        try {
            const res = await fetch(`${API_BASE}/seo/requirements/add`, {
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
                toast.success(`${type} Added & Assigned to Specialist!`);
                setInput('');
                fetchItems();
            }
        } catch(err) { toast.error("Error adding item"); }
    };

    const handleDeleteItem = async (itemId) => {
        if(window.confirm("Delete this item and its linked task?")) {
            try {
                const res = await fetch(`${API_BASE}/seo/requirements/delete/${itemId}`, { method: 'DELETE' });
                if(res.ok) {
                    toast.success("Item Deleted");
                    fetchItems(); 
                }
            } catch(err) { toast.error("Error deleting item"); }
        }
    };

    const updateClientStatus = async (field, value) => {
        // ✅ WebDev Logic: Check tasks before completing project
        if (field === 'projectStatus' && value === 'Completed') {
            if (client.clientStatus !== 'Completed') {
                return toast.error("Cannot complete project! Set Client Status to 'Completed' first.");
            }
            const areAllTasksDone = items.every(item => item.assignedTaskId?.status === 'Completed');
            if (!areAllTasksDone) {
                return toast.error("All SEO Requirements and Changes must be 'Completed' first!");
            }
        }

        try {
            const res = await fetch(`${API_BASE}/seo/client/update/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ [field]: value })
            });
            if(res.ok) {
                setClient(prev => ({ ...prev, [field]: value }));
                toast.success("Status Updated");
            }
        } catch(err) { toast.error("Update failed"); }
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    };

    const requirements = items.filter(i => i.type === 'Requirement');
    const changes = items.filter(i => i.type === 'Change');

    if(!client) return <div style={{padding:'20px'}}>Loading SEO Project...</div>;

    return (
        <div className="admin-dashboard">
            <main className="main-content-child" style={{padding:'30px'}}>
                
                {/* 1. HEADER & CLIENT DETAILS (Editable) */}
                <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                            <button onClick={()=>navigate('/seo/clients')} className="modern-back-btn"><ArrowLeft size={20}/> Back</button>
                            <div>
                                {isEditing ? (
                                    <input className="edit-input" value={editData.businessName} onChange={e=>setEditData({...editData, businessName: e.target.value})} style={{fontSize: '24px', fontWeight: 'bold', width: '100%'}} />
                                ) : (
                                    <h1 style={{margin:0, fontSize:'24px', color:'#FF4500'}}>{client.businessName}</h1>
                                )}
                            </div>
                        </div>
                        <button onClick={() => isEditing ? handleSaveClientDetails() : setIsEditing(true)} className="btn-primary" style={{background: isEditing ? '#10b981' : '#3b82f6', display:'flex', gap:'5px'}}>
                            {isEditing ? <Check size={16}/> : <Edit2 size={16}/>} {isEditing ? 'Save Details' : 'Edit Details'}
                        </button>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px'}}>
                        <div>
                            <label style={{fontSize: '11px', color: '#888', fontWeight:'bold'}}>CLIENT NAME</label>
                            {isEditing ? <input className="edit-input" value={editData.clientName} onChange={e=>setEditData({...editData, clientName: e.target.value})} /> : <div style={{marginTop:'5px'}}><User size={14}/> {client.clientName}</div>}
                        </div>
                        <div>
                            <label style={{fontSize: '11px', color: '#888', fontWeight:'bold'}}>WEBSITE</label>
                            {isEditing ? <input className="edit-input" value={editData.website} onChange={e=>setEditData({...editData, website: e.target.value})} /> : <div style={{marginTop:'5px'}}><Globe size={14} color="#3b82f6"/> {client.website || 'N/A'}</div>}
                        </div>
                        <div>
                            <label style={{fontSize: '11px', color: '#FF4500', fontWeight:'bold'}}>SEO SPECIALIST</label>
                            {isEditing ? (
                                <select value={editData.assignedDev} onChange={e => setEditData({...editData, assignedDev: e.target.value})} style={{width:'100%', padding:'8px', border:'1px solid #ddd', borderRadius:'6px', marginTop:'5px'}}>
                                    <option value="">-- Assign Specialist --</option>
                                    {specialists.map(dev => <option key={dev._id} value={dev._id}>{dev.name}</option>)}
                                </select>
                            ) : (
                                <div style={{marginTop:'5px', fontWeight:'bold', color: client.assignedDev ? '#10b981' : '#dc2626'}}>
                                    {specialists.find(d => d._id === (client.assignedDev?._id || client.assignedDev))?.name || 'Not Assigned'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. REQUIREMENTS & CHANGES (Two Column Layout) */}
                <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
                    
                    {/* Left: SEO Requirements */}
                    <div style={{flex:1, minWidth:'300px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                        <h3 style={{marginTop:0, borderBottom:'2px solid #FF4500', display:'inline-block', paddingBottom:'5px'}}>Requirements</h3>
                        <div style={{display:'flex', gap:'10px', margin:'15px 0'}}>
                            <input type="text" placeholder="Audit, On-page..." style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:'5px'}} value={reqInput} onChange={e=>setReqInput(e.target.value)} />
                            <button className="btn-primary" onClick={()=>handleAddItem('Requirement', reqInput, setReqInput)}><Plus size={18}/></button>
                        </div>
                        <div className="item-list">
                            {requirements.map(item => (
                                <div key={item._id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div>
                                        <div style={{fontSize:'14px', fontWeight:'500'}}>{item.description}</div>
                                        <div style={{fontSize:'11px', color:'#888'}}><User size={10}/> {item.assignedTo?.name}</div>
                                    </div>
                                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                        <div className={`status-pill ${item.assignedTaskId?.status === 'Completed' ? 'completed' : 'pending'}`}>{item.assignedTaskId?.status || 'Pending'}</div>
                                        <button onClick={() => handleDeleteItem(item._id)} style={{background:'none', border:'none', color:'#dc2626', cursor:'pointer'}}><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Optimization Changes */}
                    <div style={{flex:1, minWidth:'300px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                        <h3 style={{marginTop:0, borderBottom:'2px solid #3b82f6', display:'inline-block', paddingBottom:'5px'}}>Optimization Changes</h3>
                        <div style={{display:'flex', gap:'10px', margin:'15px 0'}}>
                            <input type="text" placeholder="Meta updates, link fixes..." style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:'5px'}} value={changeInput} onChange={e=>setChangeInput(e.target.value)} />
                            <button className="btn-primary" style={{background:'#3b82f6'}} onClick={()=>handleAddItem('Change', changeInput, setChangeInput)}><Plus size={18}/></button>
                        </div>
                        <div className="item-list">
                            {changes.map(item => (
                                <div key={item._id} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                    <div><div style={{fontSize:'14px'}}>{item.description}</div><div style={{fontSize:'11px', color:'#888'}}><User size={10}/> {item.assignedTo?.name}</div></div>
                                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                        <div className={`status-pill ${item.assignedTaskId?.status === 'Completed' ? 'completed' : 'pending'}`}>{item.assignedTaskId?.status || 'Pending'}</div>
                                        <button onClick={() => handleDeleteItem(item._id)} style={{background:'none', border:'none', color:'#dc2626', cursor:'pointer'}}><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. STATUS, TIMELINE & PAYMENTS */}
                <div style={{marginTop:'30px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                    <h3 style={{marginTop:0}}>Project Control & Timeline</h3>
                    
                    <div style={{display:'flex', gap:'20px', padding:'20px', background:'#f9fafb', borderRadius:'8px', flexWrap:'wrap', marginBottom:'20px'}}>
                        <div style={{flex:1, textAlign:'center'}}>
                            <label style={{display:'block', fontWeight:'600', marginBottom:'10px'}}>Client Status</label>
                            <select value={client.clientStatus} onChange={e=>updateClientStatus('clientStatus', e.target.value)} style={{padding:'10px', borderRadius:'5px', border:'1px solid #ddd', width:'80%'}}>
                                <option value="Pending">Pending</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                        <div style={{flex:1, textAlign:'center'}}>
                            <label style={{display:'block', fontWeight:'600', marginBottom:'10px'}}>Project Status</label>
                            <select value={client.projectStatus} onChange={e=>updateClientStatus('projectStatus', e.target.value)} style={{padding:'10px', borderRadius:'5px', border:'1px solid #ddd', width:'80%'}}>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', padding:'15px', background:'#f9fafb', borderRadius:'8px'}}>
                        <div>
                            <label style={{fontSize:'12px', fontWeight:'600'}}>START DATE</label>
                            <input type="date" value={formatDateForInput(client.startDate)} onChange={e => updateClientStatus('startDate', e.target.value)} style={{width:'100%', padding:'8px', borderRadius:'5px', border:'1px solid #ddd'}}/>
                        </div>
                        <div>
                            <label style={{fontSize:'12px', fontWeight:'600'}}>END DATE</label>
                            <input type="date" value={formatDateForInput(client.endDate)} onChange={e => updateClientStatus('endDate', e.target.value)} style={{width:'100%', padding:'8px', borderRadius:'5px', border:'1px solid #ddd'}}/>
                        </div>
                        <div>
                            <label style={{fontSize:'12px', fontWeight:'600'}}>ADVANCE DATE</label>
                            <input type="date" value={formatDateForInput(client.advancePaymentDate)} onChange={e => updateClientStatus('advancePaymentDate', e.target.value)} style={{width:'100%', padding:'8px', borderRadius:'5px', border:'1px solid #ddd'}}/>
                        </div>
                        <div>
                            <label style={{fontSize:'12px', fontWeight:'600'}}>FULL PAYMENT DATE</label>
                            <input type="date" value={formatDateForInput(client.fullPaymentDate)} onChange={e => updateClientStatus('fullPaymentDate', e.target.value)} style={{width:'100%', padding:'8px', borderRadius:'5px', border:'1px solid #ddd'}}/>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SEOProject;