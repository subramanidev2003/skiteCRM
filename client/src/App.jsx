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
import Projects from "./pages/Projects.jsx";
import SocialMediaClients from "./components/SocialMediaClients.jsx";
import SocialMediaProject from "./components/SocialMediaProject.jsx";
import WebDevClients from "./components/WebDevClients.jsx";
import WebDevProject from "./components/WebDevProject.jsx";
import ReceiptHistory from "./pages/ReceiptHistory.jsx";
import PaymentReceipt from "./pages/PaymentReceipt.jsx";
import FixedInvoice from "./components/FixedInvoice.jsx";

// ✅ 1. OfferLetter Import
import OfferLetter from "./pages/OfferLetter.jsx";
import BulkAttendance from "./pages/BulkAttendance.jsx";


function App() {
  return (
    <>
      <ToastContainer />

      <Routes>
        <Route path="/" element={<Login />} />

        {/* --- EMPLOYEE DASHBOARD --- */}
        <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        </Route>

        {/* --- SALES ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["sales", "Sales"]} />}>
          <Route element={<SalesLayout />}>
            <Route path="/sales-dashboard" element={<SalesDashboard />} />
            {/* ... other sales routes ... */}
          </Route>
        </Route>

        {/* --- MANAGER DASHBOARD --- */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-dashboard/tasks" element={<Task />} />
          <Route path="/manager-dashboard/attendance" element={<Attendance />} />
        </Route>

        {/* --- ADMIN DASHBOARD (Manager-aiyum ippo allow panniyachu) --- */}
        {/* ✅ Inga 'manager' role-ah add pannittaen, appo thaan 404 varaathu */}
        <Route element={<ProtectedRoute allowedRoles={["Admin", "accountant", "employee", "manager"]} />}>
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
            <Route path="/admin-dashboard/all-leads" element={<AllLeadPage />} />
            <Route path="/admin-dashboard/conversion" element={<Conversion />} />
            <Route path="/admin-dashboard/payroll" element={<PayRoll />} />
            <Route path="/admin-dashboard/invoice" element={<Invoice />} />
            <Route path="invoice/:id" element={<Invoice />} />
            <Route path="invoice-history" element={<InvoiceHistory />} />
            <Route path="fixed-invoice" element={<FixedInvoice />} />
            
            <Route path="/admin-dashboard/quote" element={<Quote />} />
            <Route path="quote/:id" element={<Quote />} />
            <Route path="/admin-dashboard/quote-history" element={<QuoteHistory />} />
            
            <Route path="/admin-dashboard/accounts" element={<Accounts />} />
            <Route path="financial-graph" element={<FinancialGraph />} />
            <Route path="invoice-payment" element={<InvoicePayment />} />
            <Route path="income-expense" element={<IncomeExpense />} />

            <Route path="/admin-dashboard/receipt" element={<PaymentReceipt />} />
            <Route path="/admin-dashboard/receipt-history" element={<ReceiptHistory />} />
            
            <Route path="/admin-dashboard/projects" element={<Projects />} />
            <Route path="/admin-dashboard/bulk-attendance" element={<BulkAttendance />} />

            <Route path="offer-letter" element={<OfferLetter />} />
          </Route>

          <Route path="/add-employee" element={<AddEmployee />} />
        </Route>

        {/* --- PROJECT SUB-PAGES --- */}
        <Route path="/social-media/clients" element={<SocialMediaClients />} />
        <Route path="/projects/social-media/:id" element={<SocialMediaProject />} />
        
        <Route path="/webdev/clients" element={<WebDevClients />} />
        <Route path="/webdev/project/:id" element={<WebDevProject />} />
        
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;