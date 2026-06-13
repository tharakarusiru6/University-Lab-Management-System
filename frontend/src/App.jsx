import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Layout from './components/common/Layout.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import AdminApp from './pages/AdminPages.jsx';
import LecturerApp from './pages/LecturerPages.jsx';
import AssistantApp from './pages/AssistantPages.jsx';
import StudentApp from './pages/StudentPages.jsx';
import { Spinner } from './components/common/UI.jsx';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Spinner size={36} />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role === 'lab_assistant' ? 'assistant' : user.role}`} replace />;

  return <Layout>{children}</Layout>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = { admin: '/admin', lecturer: '/lecturer', lab_assistant: '/assistant', student: '/student' };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomeRedirect />} />

            <Route path="/admin/*" element={
              <ProtectedRoute role="admin">
                <AdminApp />
              </ProtectedRoute>
            } />

            <Route path="/lecturer/*" element={
              <ProtectedRoute role="lecturer">
                <LecturerApp />
              </ProtectedRoute>
            } />

            <Route path="/assistant/*" element={
              <ProtectedRoute role="lab_assistant">
                <AssistantApp />
              </ProtectedRoute>
            } />

            <Route path="/student/*" element={
              <ProtectedRoute role="student">
                <StudentApp />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
