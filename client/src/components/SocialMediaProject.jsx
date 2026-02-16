import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Video, FileText, Edit, Send, Calendar, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import './SocialMedia.css';

const API_BASE = 'https://skitecrm.onrender.com/api';

const SocialMediaProject = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [activeTab, setActiveTab] = useState('Shoot');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    
    // ✅ NEW: Client Details State
    const [clientDetails, setClientDetails] = useState({ clientName: 'Loading...', businessName: '' });

    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        details: '',
        assignedTo: ''
    });

    useEffect(() => {
        if (id) {
            fetchItems();
            fetchClientInfo(); // ✅ Call Fetch Client Info
        }
    }, [id, activeTab]);

    useEffect(() => {
        if (isModalOpen) {
            if (activeTab === 'Script') fetchEmployees('Content Writer');
            if (activeTab === 'Edit') fetchEmployees('Video Editor');
        }
    }, [isModalOpen, activeTab]);

    // ✅ NEW: Fetch Single Client Info for Header
    const fetchClientInfo = async () => {
        try {
            // Need a route like: router.get('/client-details/:id') in backend
            const res = await fetch(`${API_BASE}/content/client-details/${id}`);
            const data = await res.json();
            if (res.ok) {
                setClientDetails(data);
            }
        } catch (err) { console.error("Error fetching client details", err); }
    };

    const fetchItems = async () => {
        try {
            const res = await fetch(`${API_BASE}/content/client/${id}`);
            const data = await res.json();
            if (res.ok) {
                setItems(data.filter(item => item.type === activeTab));
            }
        } catch (err) { console.error(err); }
    };

    const fetchEmployees = async (role) => {
        try {
            const res = await fetch(`${API_BASE}/content/users/${role}`);
            const data = await res.json();
            if (res.ok) setEmployees(data);
        } catch (err) { console.error(err); }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const bodyData = { clientId: id, type: activeTab, ...formData };
            const res = await fetch(`${API_BASE}/content/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            if (res.ok) {
                toast.success(`${activeTab} Added Successfully!`);
                setIsModalOpen(false);
                setFormData({ date: '', startTime: '', endTime: '', details: '', assignedTo: '' });
                fetchItems();
            } else { toast.error("Failed to add item"); }
        } catch (err) { toast.error("Error adding item"); }
    };

    const handleDelete = async (itemId) => {
        if (window.confirm("Are you sure? This will delete the linked task as well.")) {
            try {
                await fetch(`${API_BASE}/content/delete/${itemId}`, { method: 'DELETE' });
                toast.success("Deleted successfully");
                fetchItems();
            } catch (err) { toast.error("Error deleting"); }
        }
    };

    const updateStatus = async (itemId, newStatus) => {
        try {
            await fetch(`${API_BASE}/content/update-status/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            toast.success("Status Updated");
            fetchItems();
        } catch (err) { toast.error("Update failed"); }
    };

    return (
        <div className="admin-dashboard">
            <main className="main-content-child" style={{ padding: '30px' }}>

                {/* Header Updated with Client Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <button onClick={() => navigate('/social-media/clients')} className="modern-back-btn">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div>
                        {/* ✅ Client Name in Header */}
                        <h1 style={{ margin: 0, color: '#111827' }}>
                            {clientDetails.clientName}
                        </h1>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                             Content Workflow {clientDetails.businessName && `• ${clientDetails.businessName}`}
                        </span>
                    </div>
                </div>

                {/* ... (Tabs and Table remain the same as your previous working code) ... */}
                {/* Just ensure you copy the rest of the Tabs and Table logic from the previous answer here */}
                
                <div className="tabs-container" style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
                    {['Shoot', 'Script', 'Edit', 'Post'].map((tab) => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                                border: 'none', background: 'transparent', cursor: 'pointer',
                                fontWeight: '600', color: activeTab === tab ? '#FF4500' : '#6b7280',
                                borderBottom: activeTab === tab ? '3px solid #FF4500' : '3px solid transparent'
                            }}
                        >
                            {tab === 'Shoot' && <Video size={18} />}
                            {tab === 'Script' && <FileText size={18} />}
                            {tab === 'Edit' && <Edit size={18} />}
                            {tab === 'Post' && <Send size={18} />}
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        + Add {activeTab}
                    </button>
                </div>

                {/* Table and Modal same as previous logic... */}
                {/* ... (Copy Tabs, Table, and Modal form exactly from the previous correct response) ... */}
                 
                 {/* For the Modal, use the same logic as previous answer. */}
                 {/* ... */}
                 {/* --- TABLE VIEW --- */}
                 <div className="table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Description</th>
                                {activeTab !== 'Shoot' && <th>Assigned To</th>}
                                {activeTab !== 'Shoot' && <th>Task Status</th>}
                                <th>{activeTab} Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length > 0 ? items.map((item) => {
                                const isTaskDone = item.assignedTaskId?.status === 'Completed';
                                const hasTask = item.assignedTaskId ? true : false;
                                const assignedName = item.assignedToUser?.name || 'Unassigned';

                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="date-badge" style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                                <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                                                    <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                                </div>
                                                <div style={{display:'flex', gap:'5px', alignItems:'center', fontSize:'11px', color:'#666'}}>
                                                    <Clock size={12} /> {item.startTime} - {item.endTime}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '300px', fontSize: '13px', color: '#444' }}>
                                            {item.details}
                                        </td>
                                        {activeTab !== 'Shoot' && (
                                            <td>
                                                <span style={{fontWeight:'500', color:'#374151'}}>
                                                    {activeTab === 'Post' ? 'Bhuvana' : assignedName}
                                                </span>
                                            </td>
                                        )}
                                        {activeTab !== 'Shoot' && (
                                            <td>
                                                {hasTask ? (
                                                    <span className={`task-badge ${isTaskDone ? 'done' : 'pending'}`}
                                                        style={{
                                                            padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: '600',
                                                            background: isTaskDone ? '#f0fdf4' : '#fff7ed',
                                                            color: isTaskDone ? '#15803d' : '#c2410c',
                                                            border: isTaskDone ? '1px solid #dcfce7' : '1px solid #ffedd5',
                                                            display: 'inline-flex', alignItems: 'center', gap: '5px'
                                                        }}
                                                    >
                                                        {isTaskDone ? <><CheckCircle2 size={12} /> Completed</> : <>⏳ Working</>}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        )}
                                        <td>
                                            <select
                                                value={item.status}
                                                onChange={(e) => updateStatus(item._id, e.target.value)}
                                                className={`status-select ${item.status === 'Completed' ? 'completed' : ''}`}
                                                style={{ padding: '6px', borderRadius: '5px', border: '1px solid #ddd', cursor:'pointer', background: item.status === 'Completed' ? '#d1fae5' : '#fff' }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <button className="icon-btn" onClick={() => handleDelete(item._id)}>
                                                    <Trash2 size={18} color="#dc2626" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={activeTab === 'Shoot' ? 4 : 6} style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No {activeTab} plans found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '500px' }}>
                            <h3 style={{ marginTop: 0 }}>Add {activeTab} Plan</h3>
                            <form onSubmit={handleAddItem}>
                                <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div style={{display:'flex', gap:'15px'}}>
                                    <div className="input-group" style={{flex:1}}>
                                        <label>Start Time</label>
                                        <input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                    <div className="input-group" style={{flex:1}}>
                                        <label>End Time</label>
                                        <input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Description</label>
                                    <textarea rows="3" required placeholder="Enter details..." value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                                </div>
                                {activeTab === 'Script' && (
                                    <div className="input-group">
                                        <label>Assign to Content Writer</label>
                                        <select required value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} style={{width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}}>
                                            <option value="">Select Writer</option>
                                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeTab === 'Edit' && (
                                    <div className="input-group">
                                        <label>Assign to Video Editor</label>
                                        <select required value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} style={{width:'100%', padding:'10px', borderRadius:'5px', border:'1px solid #ddd'}}>
                                            <option value="">Select Editor</option>
                                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeTab === 'Post' && (
                                    <div style={{padding:'10px', background:'#f0f9ff', color:'#0284c7', borderRadius:'5px', marginBottom:'15px', fontSize:'13px'}}>
                                        ℹ️ This task will be automatically assigned to <b>Bhuvana</b>.
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button type="submit" className="btn-primary-fill" style={{ flex: 1 }}>Save</button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>Cancel</button>
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