import React from 'react';
import { Routes, Route } from "react-router-dom";
import AdminDashboard from './pages/AdminDashboard.jsx';
import Task from "./pages/Task.jsx";
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import Login from './pages/Login.jsx';
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import Team from "./pages/Team.jsx";
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Attendance from './pages/Attendance.jsx';
import AddEmployee from './pages/AddEmployee.jsx';
import EditEmployee from './pages/EditEmployee.jsx';
import ManagerDashboard from './pages/ManagerDashboard.jsx';

function App() {
  return (
    <>
      <ToastContainer />

      <Routes>
        <Route path="/" element={<Login />} />
        {/* <Route path='/home' element={<Home />}/> */}

        {/* --- EMPLOYEE ROUTES (Only for employees) --- */}
        <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        </Route>
        {/* --- MANAGER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-dashboard/tasks" element={<Task />} />
    <Route path="/manager-dashboard/attendance" element={<Attendance />} />
        </Route>

        {/* --- ADMIN ROUTES (Only for admins) --- */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route index element={null} />
            <Route path="teams" element={<Team />} />
            <Route path="teams/details/:id" element={<EmployeeDetail />} />
            <Route
              path="/admin-dashboard/teams/edit/:id"
              element={<EditEmployee />}
            />
            <Route path="tasks" element={<Task />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>

          <Route path="/add-employee" element={<AddEmployee />} />
        </Route>

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;