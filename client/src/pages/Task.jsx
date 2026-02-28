import React, { useState, useEffect } from "react";
import "./Task.css";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react"; 
import { toast } from 'react-toastify'; 
import { API_BASE } from '../api';

// const API_BASE = 'https://skitecrm-1l7f.onrender.com/api';

const Task = () => {
  const navigate = useNavigate();
  
  // ✅ AUTH & ROLE LOGIC
  const adminToken = localStorage.getItem("adminToken");
  const managerToken = localStorage.getItem("managerToken");
  const token = adminToken || managerToken;
  
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));
  const managerUser = JSON.parse(localStorage.getItem('managerUser'));
  
  const isAdmin = !!adminUser; 
  const isManager = !!managerUser;

  const allowedDesignations = ['Web Developer', 'Web Developer(intern)', 'SEO(intern)'];

  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [filters, setFilters] = useState({ searchAssignee: "", fromDate: "", toDate: "" });
  const [taskData, setTaskData] = useState({ title: "", description: "", priority: "Medium", assignedTo: "", dueDate: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          let fetchedEmployees = data.employees || data.users || data;
          if (isManager) {
            fetchedEmployees = fetchedEmployees.filter(emp => allowedDesignations.includes(emp.designation));
          }
          setEmployees(fetchedEmployees);
          if (fetchedEmployees.length > 0) {
            setTaskData(prev => ({ ...prev, assignedTo: fetchedEmployees[0]._id }));
          }
        }
      } catch (error) { console.error("Employee fetch error:", error); }
    };
    if (token) fetchEmployees();
  }, [token, isManager]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.searchAssignee) params.append("assignedTo", filters.searchAssignee.trim());
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      
      const res = await fetch(`${API_BASE}/tasks/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (!res.ok) { setTasks([]); return; }

      let currentTasks = Array.isArray(data) ? data : [];

      if (isManager) {
        currentTasks = currentTasks.filter(task => allowedDesignations.includes(task.assignedTo?.designation));
      }

      if (filters.searchAssignee) {
        currentTasks = currentTasks.filter(task => task.assignedTo?._id === filters.searchAssignee);
      }

      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate).setHours(0, 0, 0, 0);
        currentTasks = currentTasks.filter(task => new Date(task.createdAt).setHours(0, 0, 0, 0) >= fromDate);
      }

      if (filters.toDate) {
        const toDate = new Date(filters.toDate).setHours(23, 59, 59, 999);
        currentTasks = currentTasks.filter(task => new Date(task.createdAt).setHours(0, 0, 0, 0) <= toDate);
      }

      setTasks(currentTasks);
    } catch (error) { 
      console.error("Fetch error:", error);
      setTasks([]); 
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchTasks();
    const intervalId = setInterval(fetchTasks, 5000);
    return () => clearInterval(intervalId);
  }, [filters, token]);

  // PAGINATION
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // HANDLERS
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`${API_BASE}/tasks/delete/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Task deleted successfully");
        fetchTasks();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to delete task");
      }
    } catch (error) {
      toast.error("Network error while deleting.");
    }
  };

  const handleInputChange = (e) => setTaskData({ ...taskData, [e.target.name]: e.target.value });
  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const resetFilters = () => setFilters({ searchAssignee: "", fromDate: "", toDate: "" });
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => { setIsModalOpen(false); setStatus({ loading: false, error: "", success: "" }); 
    setTaskData({ title: "", description: "", priority: "Medium", dueDate: "", assignedTo: employees.length > 0 ? employees[0]._id : "" }); 
  };
  const openViewModal = (task) => { setSelectedTask(task); setIsViewModalOpen(true); };
  const closeViewModal = () => { setIsViewModalOpen(false); setSelectedTask(null); };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });
    try {
      const res = await fetch(`${API_BASE}/tasks/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        setStatus({ loading: false, error: "", success: "Task assigned successfully!" });
        fetchTasks(); 
        setTimeout(closeModal, 1500);
      } else {
        const err = await res.json();
        setStatus({ loading: false, error: err.message || "Failed to assign" });
      }
    } catch (error) { setStatus({ loading: false, error: "Network error." }); }
  };

  return (
    <div className="tm-container">
      
      {/* Top Action Bar */}
      <div className="tm-top-bar">
        <button
          className="tm-back-btn"
          onClick={() => navigate(isAdmin ? "/admin-dashboard" : "/manager-dashboard")}
        >
          <ArrowLeft size={20} /> Back To Dashboard
        </button>
        <button className="tm-add-btn" onClick={openModal}>
          <Plus size={20} /> Assign Task
        </button>
      </div>

      {/* Header */}
      <div className="tm-title-box">
        <h2 className="tm-title">
          {isManager ? "Team Assignments" : "All Assignments"}
        </h2>
      </div>

      {/* Filters */}
      <div className="tm-filters">
        <select
          name="searchAssignee"
          value={filters.searchAssignee}
          onChange={handleFilterChange}
          className="tm-select"
        >
          <option value="">All Team Members</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name} ({emp.designation})
            </option>
          ))}
        </select>
        <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleFilterChange}
          className="tm-date-input"
        />
        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
          className="tm-date-input"
        />
        <button className="tm-reset-btn" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="tm-table-container">
        <table className="tm-table">
          <thead className="tm-thead">
            <tr>
              <th className="tm-th">TASK</th>
              <th className="tm-th">ASSIGNEE</th>
              <th className="tm-th">STATUS</th>
              <th className="tm-th">ASSIGNED DATE</th>
              <th className="tm-th">DUE DATE</th>
              {isAdmin && <th className="tm-th">ACTION</th>}
            </tr>
          </thead>
          <tbody className="tm-tbody">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "6" : "5"} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                  No relevant tasks found.
                </td>
              </tr>
            ) : (
              currentItems.map((task) => (
                <tr
                  key={task._id}
                  onClick={() => openViewModal(task)}
                >
                  {/* Task Title (Primary) */}
                  <td className="tm-td tm-task-title" data-label="Task">
                    {task.title}
                  </td>

                  {/* Assignee */}
                  <td className="tm-td" data-label="Assignee">
                    <div className="tm-assignee-box">
                      <span className="tm-assignee-name">{task.assignedTo?.name || 'Unknown'}</span>
                      <small className="tm-assignee-role">{task.assignedTo?.designation || ''}</small>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="tm-td" data-label="Status">
                    <span className={`tm-badge tm-status-${task.status?.toLowerCase().replace(/\s+/g, "-") || "pending"}`}>
                      {task.status || "Pending"}
                    </span>
                  </td>

                  {/* Dates */}
                  <td className="tm-td" data-label="Assigned Date">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="tm-td" data-label="Due Date">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>

                  {/* Action */}
                  {isAdmin && (
                    <td className="tm-td" data-label="Action">
                      <button
                        className="tm-delete-btn"
                        onClick={(e) => handleDeleteTask(task._id, e)}
                        title="Delete Task"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tasks.length > 0 && (
        <div className="tm-pagination">
          <span style={{ fontSize: '14px', color: '#555' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <button className="tm-page-btn" onClick={goToPrevPage} disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </button>
          <button className="tm-page-btn" onClick={goToNextPage} disabled={currentPage === totalPages}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ASSIGN TASK MODAL */}
      {isModalOpen && (
        <div className="tm-modal-overlay">
          <div className="tm-modal">
            <div className="tm-modal-header">
              <span className="tm-modal-title">Assign New Task</span>
              <button className="tm-close-btn" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            {status.error && <div style={{ color: "red", marginBottom: "15px" }}>{status.error}</div>}
            {status.success && <div style={{ color: "green", marginBottom: "15px" }}>{status.success}</div>}

            <form onSubmit={handleAssignTask}>
              <div className="tm-form-group">
                <label className="tm-label">Task Title</label>
                <input
                  className="tm-input"
                  type="text"
                  name="title"
                  value={taskData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter task title"
                />
              </div>
              <div className="tm-form-group">
                <label className="tm-label">Description</label>
                <textarea
                  className="tm-textarea"
                  name="description"
                  value={taskData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                  placeholder="Describe the task details"
                />
              </div>
              <div className="tm-form-group">
                <label className="tm-label">Due Date</label>
                <input
                  className="tm-input"
                  type="date"
                  name="dueDate"
                  value={taskData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="tm-form-group">
                <label className="tm-label">Assign To</label>
                <select
                  className="tm-select-input"
                  name="assignedTo"
                  value={taskData.assignedTo}
                  onChange={handleInputChange}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="tm-submit-btn" disabled={status.loading}>
                {status.loading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedTask && (
        <div className="tm-modal-overlay">
          <div className="tm-modal">
            <div className="tm-modal-header">
              <span className="tm-modal-title">Task Details</span>
              <button className="tm-close-btn" onClick={closeViewModal}>
                <X size={24} />
              </button>
            </div>
            <div>
              <h3 style={{color: '#ff4500', marginBottom: '10px'}}>{selectedTask.title}</h3>
              <p style={{background: '#f9fafb', padding: '10px', borderRadius: '8px', color: '#555', lineHeight: '1.5'}}>
                {selectedTask.description}
              </p>
              
              <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem'}}>
                <div><strong>Assigned To:</strong> {selectedTask.assignedTo?.name}</div>
                <div><strong>Assigned Date:</strong> {new Date(selectedTask.createdAt).toLocaleDateString()}</div>
                <div><strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}</div>
                <div>
                  <strong>Status: </strong> 
                  <span className={`tm-badge tm-status-${selectedTask.status?.toLowerCase().replace(/\s+/g, "-") || "pending"}`}>
                    {selectedTask.status || "Pending"}
                  </span>
                </div>
              </div>

              <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end'}}>
                <button onClick={closeViewModal} className="tm-back-btn">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;