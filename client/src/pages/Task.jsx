import React, { useState, useEffect, useRef } from "react";
import "./Task.css";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Trash2 } from "lucide-react"; 
import { toast } from 'react-toastify'; 

const API_BASE = 'https://skitecrm.onrender.com/api';

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
  const prevTasksRef = useRef([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [filters, setFilters] = useState({ searchAssignee: "", fromDate: "", toDate: "" });
  const [taskData, setTaskData] = useState({ title: "", description: "", priority: "Medium", assignedTo: "", dueDate: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

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
      setTasks(currentTasks);
    } catch (error) { setTasks([]); }
  };

  useEffect(() => {
    fetchTasks();
    const intervalId = setInterval(fetchTasks, 5000);
    return () => clearInterval(intervalId);
  }, [filters, token]);

  // --- HANDLERS ---

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
  const closeModal = () => { setIsModalOpen(false); setStatus({ loading: false, error: "", success: "" }); setTaskData({ 
      title: "", 
      description: "", 
      priority: "Medium", 
      dueDate: "", 
      // Reset assignedTo to the first employee if available, otherwise empty
      assignedTo: employees.length > 0 ? employees[0]._id : "" 
    }); };
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
    <div className="task-mgr-container">
      <div className="action-btn5 gap-3">
        <button
          className="task-btn-back mb-4"
          onClick={() =>
            navigate(isAdmin ? "/admin-dashboard" : "/manager-dashboard")
          }
        >
          <ArrowLeft size={20} /> Back To Dashboard
        </button>
        <button className="task-btn-primary1" onClick={openModal}>
          + Assign Task
        </button>
      </div>

      <div className="task-mgr-header">
        <h2 className="task-mgr-title">
          {isManager ? "Team Assignments" : "All Assignments"}
        </h2>
      </div>

      <div className="task-filters-wrapper">
        <select
          name="searchAssignee"
          value={filters.searchAssignee}
          onChange={handleFilterChange}
          className="task-filter-input"
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
          className="task-filter-input"
        />
        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
          className="task-filter-input"
        />
        <button className="task-btn-reset" onClick={resetFilters}>
          Reset
        </button>
      </div>

      <div className="task-table-wrapper">
        <table className="task-mgr-table">
          <thead>
            <tr>
              <th>TASK</th>
              <th>ASSIGNEE</th>
              <th>STATUS</th>
              <th>ASSIGNED DATE</th>
              <th>DUE DATE</th>
              {/* ✅ FIX: Use ternary operator to avoid whitespace/boolean issues in table */}
              {isAdmin ? <th>ACTION</th> : null}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? "5" : "4"} className="task-empty-state">
                  No relevant tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task._id}
                  className="task-table-row task-clickable-row"
                  onClick={() => openViewModal(task)}
                >
                  <td className="task-cell-main">{task.title}</td>
                  <td className="task-cell">
                    <div className="task-assignee-cell">
                      <span className="task-assignee-name">
                        {task.assignedTo?.name}
                      </span>
                      <br />
                      <small className="task-assignee-designation">
                        {task.assignedTo?.designation}
                      </small>
                    </div>
                  </td>
                  <td className="task-cell">
                    <span
                      className={`task-badge task-status-${
                        task.status?.toLowerCase().replace(/\s+/g, "-") ||
                        "pending"
                      }`}
                    >
                      {task.status || "Pending"}
                    </span>
                  </td>
                  <td className="task-cell">
                    {task.createdAt
                      ? new Date(task.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="task-cell">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>

                  {/* ✅ FIX: Use ternary operator here as well */}
                  {isAdmin ? (
                    <td className="task-cell">
                      <button
                        className="task-delete-icon-btn"
                        onClick={(e) => handleDeleteTask(task._id, e)}
                        style={{
                          color: "#dc2626",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN TASK MODAL */}
      {isModalOpen && (
        <div className="task-modal-overlay">
          <div className="task-modal-box">
            <div className="task-modal-header">
              <span className="task-modal-title">Assign New Task</span>
              <button className="task-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            {status.error && (
              <div
                className="task-msg-error"
                style={{ color: "red", marginBottom: "10px" }}
              >
                {status.error}
              </div>
            )}
            {status.success && (
              <div
                className="task-msg-success"
                style={{ color: "green", marginBottom: "10px" }}
              >
                {status.success}
              </div>
            )}

            <form onSubmit={handleAssignTask} className="task-form">
              <div className="task-form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  name="title"
                  value={taskData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter task title"
                />
              </div>
              <div className="task-form-group">
                <label>Task Description</label>
                <textarea
                  name="description"
                  value={taskData.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                  placeholder="Describe the task details"
                />
              </div>
              <div className="task-form-row">
                <div className="task-form-group half">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={taskData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="task-form-group">
                <label>Assign To</label>
                <select
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
              <button
                type="submit"
                className="task-btn-submit"
                disabled={status.loading}
              >
                {status.loading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedTask && (
        <div className="task-modal-overlay">
          <div className="task-modal-box task-view-mode">
            <div className="task-modal-header">
              <span className="task-modal-title">Task Details</span>
              <button className="task-modal-close" onClick={closeViewModal}>
                <X size={24} />
              </button>
            </div>
            <div className="task-view-content">
              <h3>{selectedTask.title}</h3>
              <div className="task-view-section">
                <label>Description</label>
                <p>{selectedTask.description}</p>
              </div>
              <div className="task-view-footer">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    fontSize: "0.9rem",
                    color: "#555",
                  }}
                >
                  <span>
                    <strong>Assigned:</strong>{" "}
                    {selectedTask.createdAt
                      ? new Date(selectedTask.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>
                    <strong>Due Date:</strong>{" "}
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <button className="task-btn-back" onClick={closeViewModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;