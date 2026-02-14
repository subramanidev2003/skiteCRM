import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Video, Edit, Send, Calendar, CheckCircle2, MoreVertical, Eye, Trash2 } from 'lucide-react'; // ✅ Trash2 Added
import { toast } from 'react-toastify';
import './SocialMedia.css'; 

const API_BASE = 'https://skitecrm.onrender.com/api';

const SocialMediaProject = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  // State
  const [activeTab, setActiveTab] = useState('Shoot'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState([]);
  
  // Form Data
  const [formData, setFormData] = useState({
    scriptTitle: '',
    date: '', 
    details: '', 
    link: '' 
  });

  useEffect(() => {
    if(id) fetchItems();
  }, [id, activeTab]); 

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/content/client/${id}`); 
      const data = await res.json();
      if(res.ok) {
         const filtered = data.filter(item => item.type === activeTab);
         setItems(filtered);
      }
    } catch (err) { console.error(err); }
  };

  // ✅ DELETE FUNCTION ADDED
  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
        try {
            const res = await fetch(`${API_BASE}/content/delete/${itemId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success("Item Deleted Successfully");
                fetchItems(); // List refresh aagum
            } else {
                toast.error("Failed to delete");
            }
        } catch (err) {
            toast.error("Error deleting item");
        }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    let endpoint = '/content/add-shoot'; 
    let bodyData = { 
        clientId: id,
        scriptTitle: formData.scriptTitle,
        details: formData.details
    };

    if (activeTab === 'Shoot') {
        endpoint = '/content/add-shoot';
        bodyData.shootDate = formData.date;
        bodyData.shootDetails = formData.details;
    } else if (activeTab === 'Edit') {
        endpoint = '/content/add-edit'; 
        bodyData.editDate = formData.date;
        bodyData.editDetails = formData.details;
    } else if (activeTab === 'Post') {
        endpoint = '/content/add-post'; 
        bodyData.postDate = formData.date;
        bodyData.caption = formData.details;
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        if (res.ok) {
            toast.success(`${activeTab} Added Successfully!`);
            setIsModalOpen(false);
            setFormData({ scriptTitle: '', date: '', details: '', link: '' });
            fetchItems(); 
        }
    } catch (err) { toast.error("Error adding item"); }
  };

  const updateStatus = async (itemId, newStatus) => {
      try {
          await fetch(`${API_BASE}/content/update-status/${itemId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus, type: activeTab }) 
          });
          toast.success("Status Updated");
          fetchItems();
      } catch (err) { toast.error("Update failed"); }
  };

  return (
    <div className="admin-dashboard">
        <main className="main-content-child" style={{padding: '30px'}}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate('/social-media/clients')} className="modern-back-btn">
                    <ArrowLeft size={20} /> Back
                </button>
                <h1 style={{ margin: 0, color: '#111827' }}>Content Workflow</h1>
            </div>

            {/* --- TABS --- */}
            <div style={{display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px'}}>
                <button className={`tab-btn ${activeTab === 'Shoot' ? 'active-shoot' : ''}`} onClick={() => setActiveTab('Shoot')}>
                    <Video size={18} /> Shoot Plan
                </button>
                <button className={`tab-btn ${activeTab === 'Edit' ? 'active-edit' : ''}`} onClick={() => setActiveTab('Edit')}>
                    <Edit size={18} /> Editing
                </button>
                <button className={`tab-btn ${activeTab === 'Post' ? 'active-post' : ''}`} onClick={() => setActiveTab('Post')}>
                    <Send size={18} /> Posting
                </button>
            </div>

            {/* --- ADD BUTTON --- */}
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
                <button 
                    className="btn-primary" 
                    onClick={() => setIsModalOpen(true)}
                    style={{backgroundColor: activeTab === 'Shoot' ? '#FF4500' : activeTab === 'Edit' ? '#3b82f6' : '#10b981'}}
                >
                    + Add New {activeTab}
                </button>
            </div>

            {/* --- TABLE VIEW --- */}
            <div className="table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>{activeTab === 'Post' ? 'Caption / Topic' : 'Script Title'}</th>
                            <th>Details</th>
                            {activeTab === 'Shoot' && <th>Script Status</th>}
                            <th>{activeTab} Status</th>
                            <th style={{textAlign: 'center'}}>Action</th> {/* Header Center */}
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? items.map((item) => {
                            const isScriptDone = item.assignedTaskId?.status === 'Completed';
                            const hasTask = item.assignedTaskId ? true : false;

                            return (
                            <tr key={item._id}>
                                <td>
                                    <div className="date-badge">
                                        <Calendar size={14}/> 
                                        {new Date(item.shootDate || item.editDate || item.postDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={{fontWeight: '600', color: '#333'}}>
                                    {item.scriptTitle || item.caption || '-'}
                                </td>
                                <td style={{maxWidth: '300px', fontSize: '13px', color: '#666'}}>
                                    {item.shootDetails || item.editDetails || item.caption}
                                </td>

                                {activeTab === 'Shoot' && (
                                    <td>
                                        {hasTask ? (
                                            <span className={`task-badge ${isScriptDone ? 'done' : 'pending'}`}>
                                                {isScriptDone ? <><CheckCircle2 size={12}/> Script Ready</> : <>⏳ Writer Working</>}
                                            </span>
                                        ) : <span style={{fontSize: '12px', color: '#ccc'}}>-</span>}
                                    </td>
                                )}

                                <td>
                                    <select 
                                        value={item.shootStatus || item.editStatus || item.postStatus || 'Pending'}
                                        onChange={(e) => updateStatus(item._id, e.target.value)}
                                        className={`status-select ${item.shootStatus === 'Completed' || item.editStatus === 'Completed' || item.postStatus === 'Posted' ? 'completed' : ''}`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value={activeTab === 'Post' ? 'Posted' : 'Completed'}>
                                            {activeTab === 'Post' ? 'Posted' : 'Completed'}
                                        </option>
                                    </select>
                                </td>
                                
                                {/* ✅ ACTION COLUMN (View & Delete) */}
                                <td>
                                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                        <button className="icon-btn" title="View Details">
                                            <Eye size={18} color="#666"/>
                                        </button>
                                        
                                        {/* Delete Button */}
                                        <button 
                                            className="icon-btn delete-btn" 
                                            title="Delete"
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            <Trash2 size={18} color="#dc2626"/> {/* Red Color Icon */}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                        }) : (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '30px', color: '#999'}}>No {activeTab} items found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth: '500px'}}>
                        <h3 style={{marginTop: 0}}>Add New {activeTab}</h3>
                        <form onSubmit={handleAddItem}>
                            <div className="input-group">
                                <label>{activeTab === 'Post' ? 'Caption / Topic' : 'Script Title'}</label>
                                <input type="text" required placeholder={activeTab === 'Post' ? "e.g. New Product Launch" : "e.g. Benefits of SEO"} value={formData.scriptTitle} onChange={e => setFormData({...formData, scriptTitle: e.target.value})}/>
                            </div>
                            <div className="input-group">
                                <label>Date</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                            </div>
                            <div className="input-group">
                                <label>{activeTab === 'Shoot' ? 'Shoot Concept' : activeTab === 'Edit' ? 'Editing Instructions' : 'Caption / Hashtags'}</label>
                                <textarea rows="3" required placeholder="Enter details..." value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}/>
                            </div>
                            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                                <button type="submit" className="btn-primary-fill" style={{flex: 1}}>Save {activeTab}</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{background: 'transparent', border: 'none', color: '#666', cursor: 'pointer'}}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default SocialMediaProject;