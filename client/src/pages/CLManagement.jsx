import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';
import { Calendar, Search } from 'lucide-react';

const CLManagement = () => {
  const [reports, setReports] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchCLReports = async () => {
    try {
      // ✅ Step 3-la namma panna Backend API-ai inga fetch panrom
      const res = await fetch(`${API_BASE}/leaves/cl-reports?from=${fromDate}&to=${toDate}`);
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCLReports();
  }, [fromDate, toDate]); // Date maathuna udane auto-ah refresh aagum

  return (
    <div className="p-6">
      <h2>Casual Leave Management</h2>

      {/* ✅ FROM & TO DATE FILTERS */}
      <div className="flex gap-4 my-4">
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Designation</th>
            <th>From</th>
            <th>To</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr><td colSpan="6">No Casual Leaves found for this range.</td></tr>
          ) : (
            reports.map((report) => (
              <tr key={report._id}>
                <td>{report.userId?.name}</td>
                <td>{report.userId?.designation}</td>
                <td>{new Date(report.fromDate).toLocaleDateString()}</td>
                <td>{new Date(report.toDate).toLocaleDateString()}</td>
                <td>{report.reason}</td>
                <td className="text-green-600 font-bold">{report.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CLManagement;