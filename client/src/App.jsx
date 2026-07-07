import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ReportForm from './pages/ReportForm';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
};

function AppContent() {
  return (
    <Routes>
      {/* Public: NSS Report Submission Form */}
      <Route path="/" element={<ReportForm />} />

      {/* Admin Auth */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Protected Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} />
      </Router>
    </AuthProvider>
  );
}
