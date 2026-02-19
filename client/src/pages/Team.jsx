import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Trash2, Mail, Calendar, User, Search } from "lucide-react";
import "./Team.css"; // ✅ New CSS File

const API_BASE = "https://skitecrm-1l7f.onrender.com/api";
const UPLOADS_URL = "https://skitecrm-1l7f.onrender.com/api/uploads";

const Team = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState({ loading: true, error: "" });

  const fetchEmployees = async () => {
    setStatus({ loading: true, error: "" });
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/user/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate("/");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setEmployees(data);
        setStatus({ loading: false, error: "" });
      } else {
        setStatus({ loading: false, error: data.message || "Failed to load" });
      }
    } catch (error) {
      setStatus({ loading: false, error: "Network Error" });
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${name}?`)) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE}/user/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setEmployees(prev => prev.filter(emp => emp._id !== id));
        toast.success("Deleted successfully");
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) { toast.error("Error deleting"); }
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${UPLOADS_URL}/${path.replace(/^\//, "")}`;
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="team-container">
      
      {/* Header Section */}
      <div className="team-header">
        <div className="header-left">
            <button className="btn-back" onClick={() => navigate("/admin-dashboard")}>
                <ArrowLeft size={18} /> Back
            </button>
            <h1 className="page-title">Team Management</h1>
            <p className="page-subtitle">Manage your employees and their roles.</p>
        </div>
        <div className="header-right">
            <div className="search-box">
                <Search size={18} className="search-icon"/>
                <input 
                    type="text" 
                    placeholder="Search employees..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="btn-add" onClick={() => navigate("/add-employee")}>
                + Add Member
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="team-content">
        {status.loading ? (
            <div className="loading-state">Loading team data...</div>
        ) : filteredEmployees.length === 0 ? (
            <div className="empty-state">No team members found.</div>
        ) : (
            <div className="table-card">
                <table className="team-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Contact</th>
                            <th>Join Date</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((emp) => {
                            const imgUrl = getImageUrl(emp.image);
                            return (
                                <tr key={emp._id} onClick={() => navigate(`/admin-dashboard/teams/details/${emp._id}`)}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-wrapper">
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt={emp.name} onError={(e) => e.target.style.display='none'} />
                                                ) : (
                                                    <div className="avatar-placeholder">{emp.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <div className="user-info">
                                                <span className="name">{emp.name}</span>
                                                <span className="id">ID: {emp._id.slice(-6).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="role-badge">{emp.designation}</span>
                                    </td>
                                    <td>
                                        <div className="contact-cell">
                                            <Mail size={14} /> {emp.email}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} /> 
                                            {emp.dob ? new Date(emp.dob).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button className="btn-icon-delete" onClick={(e) => handleDelete(e, emp._id, emp.name)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default Team;