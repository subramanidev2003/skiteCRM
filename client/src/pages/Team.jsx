// src/pages/Team.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Team.css";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

const API_BASE = "http://localhost:4000/api";
// ✅ FIXED: Correct upload URL without /uploads path
const UPLOADS_URL = "http://localhost:4000/api/uploads";

const Team = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });

  const fetchEmployees = async () => {
    setStatus({ loading: true, error: "" });
    const token = localStorage.getItem("adminToken");

    if (!token) {
      setStatus({
        loading: false,
        error: "Authentication required. Please login.",
      });
      navigate("/");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/user/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        const data = await res.json();
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setStatus({
          loading: false,
          error: data.message || "Session expired. Please log in again.",
        });
        navigate("/");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        // ✅ DEBUG: Log employee data to check image field
        console.log("📸 Employee data received:", data);
        data.forEach(emp => {
          console.log(`Employee: ${emp.name}, Image: ${emp.image}`);
        });
        setEmployees(data);
        setStatus({ loading: false, error: "" });
      } else {
        setStatus({
          loading: false,
          error: data.message || "Failed to load employees",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setStatus({
        loading: false,
        error: "Network error. Could not connect to the server.",
      });
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEmployeeClick = (employeeId) => {
    console.log("🚀 Navigating to employee:", employeeId);
    navigate(`/admin-dashboard/teams/details/${employeeId}`);
  };

  const handleDelete = async (e, employeeId, employeeName) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${employeeName}?`
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(`${API_BASE}/user/delete/${employeeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete employee.");
        return;
      }

      setEmployees((prev) => prev.filter((emp) => emp._id !== employeeId));
      toast.success("Employee deleted successfully!");
    } catch (err) {
      toast.error("Network error while deleting employee.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ NEW: Helper function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log('⚠️ No image path provided');
      return null;
    }
    
    console.log('🔍 Original image path:', imagePath);
    
    // If imagePath already includes full URL, return as is
    if (imagePath.startsWith('http')) {
      console.log('✅ Full URL detected:', imagePath);
      return imagePath;
    }
    
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Construct full URL
    const fullUrl = `${UPLOADS_URL}/${cleanPath}`;
    console.log('🖼️ Constructed image URL:', fullUrl);
    return fullUrl;
  };

  // ✅ NEW: Handle image load errors
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex'; // Show placeholder
  };

  if (status.loading) {
    return (
      <div className="team-page-container">
        <h2>Team Members</h2>
        <p>Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="team-page-container">
      <button
        className="btn-primary1 mb-4"
        onClick={() => navigate("/admin-dashboard")}
      >
        <ArrowLeft size={20} /> Back To Dashboard
      </button>
      <h1 className="team-page-title">Team Members</h1>

      {status.error && <div className="error-message">{status.error}</div>}

      <table className="employee-table team-list-table">
        <thead>
          <tr>
            <th className="table-header">Name</th>
            <th className="table-header">Designation</th>
            <th className="table-header">Email</th>
            <th className="table-header">DOB</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => {
            const imageUrl = getImageUrl(emp.image);
            
            return (
              <tr
                key={emp._id}
                className="table-row employee-clickable-row"
                onClick={() => handleEmployeeClick(emp._id)}
              >
                <td className="table-cell">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "10px" }}
                  >
                    {/* ✅ FIXED: Improved image rendering with error handling */}
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={emp.name}
                          className="table-profile-image"
                          onError={handleImageError}
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                        {/* Placeholder - hidden by default, shown on error */}
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: "#eee",
                            display: "none",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          {emp.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#eee",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: "#666",
                        }}
                      >
                        {emp.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    {emp.name}
                  </div>
                </td>

                <td className="table-cell">{emp.designation}</td>
                <td className="table-cell">{emp.email}</td>
                <td className="table-cell">{formatDate(emp.dob)}</td>

                <td className="table-cell">
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, emp._id, emp.name)}
                    style={{
                      background: "#ff4d4d",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {employees.length === 0 && !status.error && !status.loading && (
        <p className="no-data-message">No employees found.</p>
      )}
    </div>
  );
};

export default Team;