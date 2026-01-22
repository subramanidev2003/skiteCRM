import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Task from "./pages/Task.jsx";
import EmployeeDetail from "./pages/EmployeeDetail.jsx";
import Login from "./pages/Login.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import Team from "./pages/Team.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Attendance from "./pages/Attendance.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import EditEmployee from "./pages/EditEmployee.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import SalesDashboard from "./pages/SalesDashboard.jsx";
import LeadPage from "./pages/LeadPage.jsx";
import ServiceType from "./pages/ServiceType.jsx";
import AdminSalesDashboard from "./pages/AdminSalesDashboard.jsx";
import AdminServiceType from "./pages/AdminServiceType.jsx";
import AdminLeadPage from "./pages/AdminLeadPage.jsx";
import Conversion from "./pages/Conversion.jsx";
import AllLeadPage from "./pages/AllLeadPage.jsx";
import SalesLayout from "./components/SalesLayout.jsx";
import PayRoll from "./pages/PayRoll.jsx";
import Invoice from "./pages/Invoice.jsx";
import InvoiceHistory from "./pages/InvoiceHistory.jsx";
import Quote from "./pages/Quote.jsx";
import QuoteHistory from "./pages/QuoteHistory.jsx";
import Accounts from "./pages/Accounts.jsx";
import InvoicePayment from "./pages/InvoicePayment.jsx";
import IncomeExpense from "./pages/IncomeExpense.jsx";
import FinancialGraph from "./pages/FinancialGraph.jsx";

function App() {
  return (
    <>
      <ToastContainer />

      <Routes>
        <Route path="/" element={<Login />} />

        {/* --- EMPLOYEE ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        </Route>

        {/* --- SALES ROUTES (✅ FIXED) --- */}
        {/* We wrap the route just like Admin and Manager below */}
        {/* --- SALES ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["sales", "Sales"]} />}>
          {/* ✅ WRAP ROUTES IN SALES LAYOUT */}
          <Route element={<SalesLayout />}>
            {/* Dashboard is the default view */}
            <Route path="/sales-dashboard" element={<SalesDashboard />} />

            {/* These pages will now appear UNDER the Header */}
            <Route path="/lead-detail/:id" element={<LeadPage />} />
            <Route
              path="/sales/service/:serviceName"
              element={<ServiceType />}
            />
            <Route
              path="/sales-dashboard/conversion"
              element={<Conversion />}
            />
            <Route
              path="/sales-dashboard/all-leads"
              element={<AllLeadPage />}
            />
          </Route>
        </Route>

        {/* --- MANAGER ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-dashboard/tasks" element={<Task />} />
          <Route
            path="/manager-dashboard/attendance"
            element={<Attendance />}
          />
        </Route>

        {/* --- ADMIN ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["Admin","accountant"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route index element={null} />
            <Route path="teams" element={<Team />} />
            <Route path="teams/details/:id" element={<EmployeeDetail />} />
            <Route path="teams/edit/:id" element={<EditEmployee />} />
            <Route path="tasks" element={<Task />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leads" element={<AdminSalesDashboard />} />
            <Route path="service/:serviceName" element={<AdminServiceType />} />
            <Route path="lead-detail/:id" element={<AdminLeadPage />} />
            <Route
              path="/admin-dashboard/all-leads"
              element={<AllLeadPage />}
            />
            <Route
              path="/admin-dashboard/conversion"
              element={<Conversion />}
            />
            <Route path="/admin-dashboard/payroll" element={<PayRoll />} />
            <Route path="/admin-dashboard/invoice" element={<Invoice />} />
            <Route path="invoice/:id" element={<Invoice />} />
            <Route path="invoice-history" element={<InvoiceHistory />} />
            <Route path="/admin-dashboard/quote" element={<Quote />} />
            <Route path="quote/:id" element={<Quote />} />
            <Route
              path="/admin-dashboard/quote-history"
              element={<QuoteHistory />}
            />
            {/* ✅ Accounts Route Added */}
            <Route path="/admin-dashboard/accounts" element={<Accounts />} />
            <Route path="financial-graph" element={<FinancialGraph />}/>
           

<Route path="invoice-payment" element={<InvoicePayment />} />
<Route path="income-expense" element={<IncomeExpense />} />
          </Route>

          <Route path="/add-employee" element={<AddEmployee />} />
        </Route>

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;























