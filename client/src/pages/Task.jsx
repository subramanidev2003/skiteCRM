import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Calendar, User, Search, X } from "lucide-react"; 
import { toast } from "react-toastify"; 
import "./Task.css"; 

const API_BASE = 'http://localhost:4000/api';

const Task = () => {
  const navigate = useNavigate();
  
  // --- AUTH ---
  const adminToken = localStorage.getItem("adminToken");
  const managerToken = localStorage.getItem("managerToken");
  const token = adminToken || managerToken;
  const isManager = !!managerToken;
  const isAdmin = !!adminToken;

  const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];

  // --- STATE ---
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [filters, setFilters] = useState({ searchAssignee: "", fromDate: "", toDate: "" });
  const [taskData, setTaskData] = useState({ title: "", description: "", priority: "Medium", assignedTo: "", dueDate: "" });
  const [status, setStatus] = useState({ loading: false });

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/all`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          let fetched = data.employees || data.users || data;
          if (isManager) fetched = fetched.filter(emp => allowedDesignations.includes(emp.designation));
          setEmployees(fetched);
          if (fetched.length > 0) setTaskData(prev => ({ ...prev, assignedTo: fetched[0]._id }));
        }
      } catch (error) { console.error(error); }
    };
    if (token) fetchEmployees();
  }, [token, isManager]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.searchAssignee) params.append("assignedTo", filters.searchAssignee);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      
      const res = await fetch(`${API_BASE}/tasks/all?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) return setTasks([]);

      let currentTasks = Array.isArray(data) ? data : [];
      if (isManager) currentTasks = currentTasks.filter(task => allowedDesignations.includes(task.assignedTo?.designation));
      setTasks(currentTasks);
    } catch (error) { setTasks([]); }
  };

  useEffect(() => { fetchTasks(); }, [filters, token]);

  // --- HANDLERS ---
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/delete/${taskId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Task deleted"); fetchTasks(); }
      else { toast.error("Failed to delete"); }
    } catch (error) { toast.error("Error deleting task"); }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setStatus({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/tasks/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        toast.success("Task Assigned!");
        fetchTasks();
        setIsModalOpen(false);
        setTaskData({ ...taskData, title: "", description: "" });
      } else { toast.error("Failed to assign"); }
    } catch (error) { toast.error("Network Error"); }
    finally { setStatus({ loading: false }); }
  };

  return (
    <div className="task-page-container">
      
      {/* ✅ NEW CLASS NAMES: task-management-header */}
      <header className="task-management-header">
        <div className="task-header-content">
            <h1 className="task-main-title">Task Management</h1>
            <p className="task-main-subtitle">Track and assign tasks to your team</p>
        </div>
        
        <div className="task-header-buttons">
            <button className="btn-secondary" onClick={() => navigate(isAdmin ? "/admin-dashboard" : "/manager-dashboard")}>
                <ArrowLeft size={18} /> Back
            </button>
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Assign Task
            </button>
        </div>
      </header>

      {/* 2. FILTERS BAR */}
      <div className="filters-bar">
        {/* Employee Select */}
        <div className="filter-group">
            <User size={18} className="filter-icon" />
            <select name="searchAssignee" value={filters.searchAssignee} onChange={e => setFilters({...filters, searchAssignee: e.target.value})}>
                <option value="">All Team Members</option>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
            </select>
        </div>

        {/* Date Inputs */}
        <div className="filter-group date-group1">
            <Calendar size={18} className="filter-icon" />
            <input 
                type="date" 
                value={filters.fromDate} 
                onChange={e => setFilters({...filters, fromDate: e.target.value})} 
                className="date-input"
            />
            <span className="separator">to</span>
            <input 
                type="date" 
                value={filters.toDate} 
                onChange={e => setFilters({...filters, toDate: e.target.value})} 
                className="date-input"
            />
        </div>

        <button className="btn-reset" onClick={() => setFilters({ searchAssignee: "", fromDate: "", toDate: "" })}>Reset</button>
      </div>

      {/* 3. TASK LIST */}
      <div className="task-grid">
        {tasks.length === 0 ? (
            <div className="empty-state">
                <Search size={48} />
                <p>No tasks found. Try adjusting filters or assign a new task.</p>
            </div>
        ) : (
            tasks.map(task => (
                <div key={task._id} className="task-card" onClick={() => { setSelectedTask(task); setIsViewModalOpen(true); }}>
                    <div className="card-header">
                        <span className={`badge priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                        {isAdmin && (
                            <button className="btn-icon delete" onClick={(e) => handleDeleteTask(task._id, e)}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    
                    <h3 className="task-title">{task.title}</h3>
                    
                    <div className="assignee-info">
                        <div className="avatar">{task.assignedTo?.name?.charAt(0)}</div>
                        <div className="details">
                            <span className="name">{task.assignedTo?.name}</span>
                            <span className="role">{task.assignedTo?.designation}</span>
                        </div>
                    </div>

                    <div className="card-footer">
                        <div className="date-info">
                            <span className="label">Due:</span>
                            <span className="value">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`badge status ${task.status.toLowerCase().replace(' ', '-')}`}>
                            {task.status}
                        </span>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- MODALS --- */}
      {isModalOpen && (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header">
                    <h2>Assign New Task</h2>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleAssignTask}>
                    <div className="input-group">
                        <label>Task Title</label>
                        <input type="text" required value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Description</label>
                        <textarea rows="3" required value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
                    </div>
                    <div className="row-group">
                        <div className="input-group">
                            <label>Assign To</label>
                            <select value={taskData.assignedTo} onChange={e => setTaskData({...taskData, assignedTo: e.target.value})}>
                                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Priority</label>
                            <select value={taskData.priority} onChange={e => setTaskData({...taskData, priority: e.target.value})}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Due Date</label>
                        <input type="date" required value={taskData.dueDate} onChange={e => setTaskData({...taskData, dueDate: e.target.value})} />
                    </div>
                    <button type="submit" className="btn-submit-full" disabled={status.loading}>
                        {status.loading ? "Assigning..." : "Confirm Assignment"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {isViewModalOpen && selectedTask && (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-header">
                    <h2>Task Details</h2>
                    <button onClick={() => setIsViewModalOpen(false)}><X size={20} /></button>
                </div>
                <div className="view-content">
                    <h3>{selectedTask.title}</h3>
                    <p className="desc">{selectedTask.description}</p>
                    <div className="meta-grid">
                        <div className="meta-item">
                            <label>Assigned To</label>
                            <p>{selectedTask.assignedTo?.name}</p>
                        </div>
                        <div className="meta-item">
                            <label>Due Date</label>
                            <p>{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="meta-item">
                            <label>Status</label>
                            <span className={`badge status ${selectedTask.status.toLowerCase()}`}>{selectedTask.status}</span>
                        </div>
                        <div className="meta-item">
                            <label>Priority</label>
                            <span className={`badge priority ${selectedTask.priority.toLowerCase()}`}>{selectedTask.priority}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Task;