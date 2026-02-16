import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, Trash2 } from 'lucide-react'; // ✅ Trash2 Icon
import { toast } from 'react-toastify';
import './SocialMedia.css'; 

const API_BASE = 'https://skitecrm.onrender.com/api';
const WebDevProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [client, setClient] = useState(null);
    const [items, setItems] = useState([]); 
    const [developers, setDevelopers] = useState([]);
    
    // Inputs
    const [reqInput, setReqInput] = useState('');
    const [changeInput, setChangeInput] = useState('');
    const [selectedDev, setSelectedDev] = useState('');

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
            if(res.ok) setClient(await res.json());
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

    const handleAddItem = async (type, description, setInput) => {
        if(!description || !selectedDev) return toast.warning("Enter description and select a developer!");
        
        try {
            const res = await fetch(`${API_BASE}/webdev/requirements/add`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ clientId: id, type, description, assignedTo: selectedDev })
            });
            if(res.ok) {
                toast.success(`${type} Added & Task Assigned!`);
                setInput('');
                fetchItems();
            }
        } catch(err) { toast.error("Error adding item"); }
    };

    // ✅ DELETE FUNCTION
    const handleDeleteItem = async (itemId) => {
        if(window.confirm("Are you sure you want to delete this item?")) {
            try {
                const res = await fetch(`${API_BASE}/webdev/requirements/delete/${itemId}`, {
                    method: 'DELETE'
                });
                if(res.ok) {
                    toast.success("Item Deleted");
                    fetchItems(); 
                } else {
                    toast.error("Failed to delete");
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
                toast.success("Status Updated");
            }
        } catch(err) { toast.error("Update failed"); }
    };

    // Filter Items
    const requirements = items.filter(i => i.type === 'Requirement');
    const changes = items.filter(i => i.type === 'Change');

    if(!client) return <div style={{padding:'20px'}}>Loading...</div>;

    return (
        <div className="admin-dashboard">
            <main className="main-content-child" style={{padding:'30px'}}>
                
                {/* Header */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                        <button onClick={()=>navigate('/webdev/clients')} className="modern-back-btn"><ArrowLeft size={20}/> Back</button>
                        <div>
                            <h1 style={{margin:0, fontSize:'24px'}}>{client.clientName}</h1>
                            <span style={{color:'#666', fontSize:'14px'}}>{client.businessName}</span>
                        </div>
                    </div>
                    
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <User size={18} color="#666"/>
                        <select 
                            className="modern-select" 
                            value={selectedDev} 
                            onChange={e=>setSelectedDev(e.target.value)}
                            style={{padding:'8px', borderRadius:'6px', border:'1px solid #ddd'}}
                        >
                            <option value="">Select Developer to Assign</option>
                            {developers.map(dev => <option key={dev._id} value={dev._id}>{dev.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* 2 Columns: Requirements & Changes */}
                <div style={{display:'flex', gap:'20px', minHeight:'60vh', flexWrap:'wrap'}}>
                    
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
                                        <button 
                                            onClick={() => handleDeleteItem(item._id)} 
                                            style={{background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#dc2626'}}
                                            title="Delete"
                                        >
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
                                    
                                    {/* ✅ HERE IS THE DELETE ICON FOR CHANGES */}
                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                        <div className={`status-pill ${item.assignedTaskId?.status === 'Completed' ? 'completed' : 'pending'}`}>
                                            {item.assignedTaskId?.status === 'Completed' ? 'Completed' : 'Pending'}
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteItem(item._id)} 
                                            style={{background:'none', border:'none', cursor:'pointer', padding:'4px', color:'#dc2626'}}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {changes.length === 0 && <div style={{textAlign:'center', color:'#999', fontSize:'13px', padding:'20px'}}>No changes requested.</div>}
                        </div>
                    </div>
                </div>

                {/* Bottom: Client Overview */}
                <div style={{marginTop:'30px', background:'white', padding:'20px', borderRadius:'10px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                    <h3 style={{marginTop:0, color:'#333'}}>Client Overview</h3>
                    <div style={{display:'flex', justifyContent:'space-around', gap:'20px', padding:'20px', background:'#f9fafb', borderRadius:'8px', flexWrap:'wrap'}}>
                        
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
                </div>

            </main>
        </div>
    );
};

export default WebDevProject;