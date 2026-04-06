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
import OfferLetter from "./pages/OfferLetter.jsx";
import BulkAttendance from "./pages/BulkAttendance.jsx";
import AdminRemainderList from "./pages/AdminRemainderList.jsx";
import OfficerDashboard from "./pages/OfficerDashboard.jsx";
import SEOClients from "./components/SEOClients.jsx";
import SEOProject from "./components/SEOProject.jsx";

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

        {/* --- OFFICER DASHBOARD --- */}
        <Route element={<ProtectedRoute allowedRoles={["officer"]} />}>
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
        </Route>

        {/* --- OFFICER STANDALONE ROUTES (AdminDashboard layout இல்லாம) --- */}
        {/* ✅ FIX: Officer click பண்ணா AdminDashboard layout-க்கு போகாம direct render ஆகும் */}
        <Route element={<ProtectedRoute allowedRoles={["officer"]} />}>
          <Route path="/officer/invoice-history" element={<InvoiceHistory />} />
          <Route path="/officer/bulk-attendance" element={<BulkAttendance />} />
          <Route path="/officer/attendance"      element={<Attendance />} />
          <Route path="/officer/payroll"         element={<PayRoll />} />
          <Route path="/officer/invoice"         element={<Invoice />} />
          <Route path="/officer/invoice/:id"     element={<Invoice />} />
          <Route path="/officer/fixed-invoice"   element={<FixedInvoice />} />
          <Route path="/officer/quote"           element={<Quote />} />
          <Route path="/officer/quote/:id"       element={<Quote />} />
          <Route path="/officer/receipt"         element={<PaymentReceipt />} />
          <Route path="/officer/accounts"        element={<Accounts />} />
          <Route path="/officer/invoice-payment" element={<InvoicePayment />} />  
          <Route path="/officer/income-expense"  element={<IncomeExpense />} />   
          <Route path="/officer/financial-graph" element={<FinancialGraph />} />  
          <Route path="/officer/offer-letter"    element={<OfferLetter />} />
          <Route path="/officer/quote-history" element={<QuoteHistory />} /> 
          <Route path="/officer/receipt-history" element={<ReceiptHistory />} />
        </Route>

        {/* --- SALES ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={["sales", "Sales"]} />}>
          <Route element={<SalesLayout />}>
            <Route path="/sales-dashboard" element={<SalesDashboard />} />
          </Route>
        </Route>

        {/* --- MANAGER DASHBOARD --- */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-dashboard/tasks"      element={<Task />} />
          <Route path="/manager-dashboard/attendance" element={<Attendance />} />
        </Route>

        {/* --- SHARED ADMIN/ACCOUNTANT/MANAGER ROUTES (AdminDashboard layout உள்ளே) --- */}
        <Route element={<ProtectedRoute allowedRoles={["Admin", "accountant", "manager"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route index element={null} />
            <Route path="teams"                  element={<Team />} />
            <Route path="teams/details/:id"      element={<EmployeeDetail />} />
            <Route path="teams/edit/:id"         element={<EditEmployee />} />
            <Route path="tasks"                  element={<Task />} />
            <Route path="attendance"             element={<Attendance />} />
            <Route path="leads"                  element={<AdminSalesDashboard />} />
            <Route path="service/:serviceName"   element={<AdminServiceType />} />
            <Route path="lead-detail/:id"        element={<AdminLeadPage />} />
            <Route path="all-leads"              element={<AllLeadPage />} />
            <Route path="conversion"             element={<Conversion />} />
            <Route path="payroll"                element={<PayRoll />} />
            <Route path="invoice"                element={<Invoice />} />
            <Route path="invoice/:id"            element={<Invoice />} />
            <Route path="invoice-history"        element={<InvoiceHistory />} />
            <Route path="fixed-invoice"          element={<FixedInvoice />} />
            <Route path="quote"                  element={<Quote />} />
            <Route path="quote/:id"              element={<Quote />} />
            <Route path="quote-history"          element={<QuoteHistory />} />
            <Route path="accounts"               element={<Accounts />} />
            <Route path="financial-graph"        element={<FinancialGraph />} />
            <Route path="invoice-payment"        element={<InvoicePayment />} />
            <Route path="income-expense"         element={<IncomeExpense />} />
            <Route path="receipt"                element={<PaymentReceipt />} />
            <Route path="receipt-history"        element={<ReceiptHistory />} />
            <Route path="projects"               element={<Projects />} />
            <Route path="bulk-attendance"        element={<BulkAttendance />} />
            <Route path="offer-letter"           element={<OfferLetter />} />
            <Route path="followups/:type"        element={<AdminRemainderList />} />
          </Route>

          <Route path="/add-employee" element={<AddEmployee />} />
        </Route>

        {/* --- PROJECT SUB-PAGES --- */}
        <Route path="/social-media/clients"       element={<SocialMediaClients />} />
        <Route path="/projects/social-media/:id"  element={<SocialMediaProject />} />
        <Route path="/webdev/clients"             element={<WebDevClients />} />
        <Route path="/webdev/project/:id"         element={<WebDevProject />} />
        <Route path="/seo/clients" element={<SEOClients />} />
        <Route path="/seo/project/:id" element={<SEOProject />} />

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;