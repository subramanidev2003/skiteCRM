// D:/Desktop/skite/client/src/pages/Task.jsx

import React, { useState, useEffect } from "react";
import { TaskCloseIcon } from "./AdminDashboard.jsx";
import "./Task.css";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from "lucide-react";
import { toast } from 'react-toastify'; // Make sure this is imported

const API_BASE = 'http://localhost:4000/api';

const Task = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✅ NEW: State for bulk deletion
  const [isDeleting, setIsDeleting] = useState(false);

  // ================================
  // 1. FILTER STATE
  // ================================
  const [filters, setFilters] = useState({
    searchAssignee: "",
    fromDate: "",
    toDate: "",
  });

  // Form Data for New Task
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
  });

  const [employeeStatus, setEmployeeStatus] = useState({ loading: true, error: "" });
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  // ================================
  // 2. FETCH EMPLOYEES (Run once)
  // ================================
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeeStatus({ loading: true, error: "" });
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        const res = await fetch(`${API_BASE}/user/all`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setEmployeeStatus({ loading: false, error: data.message || "Failed" });
          return;
        }

        // Normalize data structure
        let fetchedEmployees = [];
        if (Array.isArray(data)) fetchedEmployees = data;
        else if (data.employees && Array.isArray(data.employees)) fetchedEmployees = data.employees;
        else if (data.users && Array.isArray(data.users)) fetchedEmployees = data.users;
        else if (data.data && Array.isArray(data.data)) fetchedEmployees = data.data;

        setEmployees(fetchedEmployees);
        setEmployeeStatus({ loading: false, error: "" });

        // Set default assignee for the "Add Task" modal
        if (fetchedEmployees.length > 0) {
          setTaskData((prev) => ({ ...prev, assignedTo: fetchedEmployees[0]._id }));
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    };

    fetchEmployees();
  }, []);

  // ================================
  // 3. FETCH TASKS (Updated with Filters)
  // ================================
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      
      console.log("Filter values:", filters);
      console.log("searchAssignee value:", filters.searchAssignee);
      
      const params = new URLSearchParams();
      
      if (filters.searchAssignee && filters.searchAssignee.trim() !== "" && filters.searchAssignee !== "all") {
        params.append("assignedTo", filters.searchAssignee.trim());
      }
      
      if (filters.fromDate && filters.fromDate.trim() !== "") {
        params.append("fromDate", filters.fromDate.trim());
      }
      
      if (filters.toDate && filters.toDate.trim() !== "") {
        params.append("toDate", filters.toDate.trim());
      }
      
      const queryString = params.toString();
      const url = `${API_BASE}/tasks/all${queryString ? `?${queryString}` : ""}`;
      console.log("Fetching URL:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      console.log("Tasks fetched:", data);
      
      if (!res.ok) {
        console.error("Failed to fetch tasks:", data.message);
        setTasks([]);
        return;
      }
      
      setTasks(data);
    } catch (error) {
      console.log("Error fetching tasks", error);
      setTasks([]);
    }
  };

  // Re-fetch tasks whenever filters change
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); 

  // ================================
  // ✅ NEW: DELETE FUNCTIONS
  // ================================
  
  // Helper function to delete a single task
  const deleteSingleTask = async (id) => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${API_BASE}/tasks/delete/${id}`, { 
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (err) {
      console.error(`Error deleting task ID ${id}:`, err);
      return false;
    }
  };

  // Bulk Delete Function for Filtered Tasks
  const deleteAllFilteredTasks = async () => {
    if (tasks.length === 0) {
      alert("There are no tasks to delete.");
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to delete ALL ${tasks.length} task(s) currently shown in the table?`
    );
    if (!confirmation) {
      return;
    }

    setIsDeleting(true);
    let successfulDeletions = 0;
    const failedIds = [];

    // 1. Get all IDs to delete
    const idsToDelete = tasks.map(task => task._id).filter(id => id);

    // 2. Iterate and delete each task
    for (const id of idsToDelete) {
      const success = await deleteSingleTask(id);
      if (success) {
        successfulDeletions++;
      } else {
        failedIds.push(id);
      }
    }

    setIsDeleting(false);

    // 3. Refresh the task list
    if (successfulDeletions > 0) {
      await fetchTasks(); // Refresh to get updated list
    }

    // 4. Alert user
    if (failedIds.length === 0) {
      toast.success(`Successfully deleted ${successfulDeletions} task(s).`);
    } else {
      toast.warning(`Deleted ${successfulDeletions} task(s). ${failedIds.length} failed to delete.`);
    }
  };

  // ================================
  // HELPER FUNCTIONS
  // ================================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const handleInputChange = (e) => {
    setTaskData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Filter Inputs
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({ searchAssignee: "", fromDate: "", toDate: "" });
  };

  // ================================
  // ASSIGN TASK (CREATE)
  // ================================
  const handleAssignTask = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE}/tasks/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ loading: false, error: data.message || "Failed", success: "" });
        return;
      }

      setStatus({ loading: false, error: "", success: "Task assigned successfully!" });

      // Refresh list
      fetchTasks();

      // Reset Form
      setTaskData({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
        assignedTo: employees.length > 0 ? employees[0]._id : "",
      });

      setTimeout(() => closeModal(), 1500);
    } catch (error) {
      setStatus({ loading: false, error: "Network error.", success: "" });
    }
  };

  // ================================
  // MODAL CONTROL
  // ================================
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setStatus({ loading: false, error: "", success: "" });
  };

  // ================================
  // UI RENDER
  // ================================
  return (
    <div className="task-page-container">
      <button className="btn-primary1 mb-4" onClick={() => navigate('/admin-dashboard')}>
        <ArrowLeft size={20} /> Back To Dashboard
      </button>
      
      {/* HEADER SECTION */}
      <div className="task-header">
        <h2>All Assignments</h2>
        <button className="btn-primary1" onClick={openModal}>
          + Assign Task
        </button>
      </div>

      {/* FILTER SECTION */}
      <div className="filter1-container">
        <select
          name="searchAssignee"
          value={filters.searchAssignee}
          onChange={handleFilterChange}
          className="filter-input"
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="fromDate"
          value={filters.fromDate}
          onChange={handleFilterChange}
          className="filter-input"
          placeholder="From Date"
        />

        <input
          type="date"
          name="toDate"
          value={filters.toDate}
          onChange={handleFilterChange}
          className="filter-input"
          placeholder="To Date"
        />

        <button className="btn-reset" onClick={resetFilters}>
          Reset
        </button>

        {/* ✅ NEW: BULK DELETE BUTTON */}
        <button
          className="delete-btn"
          onClick={deleteAllFilteredTasks}
          disabled={isDeleting || tasks.length === 0}
          style={{
            backgroundColor: isDeleting || tasks.length === 0 ? '#ccc' : '#ff4d4d',
            cursor: isDeleting || tasks.length === 0 ? 'not-allowed' : 'pointer',
            padding: '8px 16px',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '500',
          }}
        >
          {isDeleting
            ? "Deleting..."
            : `Delete All ${tasks.length}`}
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th className="th-task">TASK</th>
              <th className="th-assignee">ASSIGNEE</th>
              <th className="th-priority">PRIORITY</th>
              <th className="th-status">STATUS</th>
              <th className="th-date">DUE DATE</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No tasks found matching criteria.
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => (
                <tr key={task._id || index}>
                  {/* Task Title & Desc */}
                  <td>
                    <div className="task-info">
                      <span className="task-title">{task.title}</span>
                      <span className="task-desc">
                        {task.description && task.description.length > 40
                          ? task.description.substring(0, 40) + "..."
                          : task.description}
                      </span>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="assignee-cell">
                    {task.assignedTo?.name || task.assignedTo || "Unassigned"}
                  </td>

                  {/* Priority Badge */}
                  <td>
                    <span className={`badge priority-${task.priority?.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span className={`badge status-${task.status?.toLowerCase() || 'pending'}`}>
                      {task.status || "Pending"}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="date-cell">
                    {formatDate(task.dueDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">Assign New Task</span>
              <button className="close-button" onClick={closeModal}>
                <TaskCloseIcon />
              </button>
            </div>

            {status.error && <div className="error-message">{status.error}</div>}
            {status.success && <div className="success-message">{status.success}</div>}

            <form onSubmit={handleAssignTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  name="title"
                  value={taskData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  name="description"
                  value={taskData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="row-group">
                <div className="form-group half">
                  <label className="form-label">Priority</label>
                  <select
                    name="priority"
                    value={taskData.priority}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={taskData.dueDate}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select
                  name="assignedTo"
                  value={taskData.assignedTo}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={status.loading}
              >
                {status.loading ? "Assigning..." : "Confirm Assignment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;