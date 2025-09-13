import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Roster from './components/Roster';
import ShiftExchanges from './components/ShiftExchanges';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, sessionLoading } = useAuth();
  if (sessionLoading) return <div className="p-8 text-sm text-gray-600">Memuatkan sesi...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.is_admin) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-xl border p-6 text-red-600">Access denied. Admin only.</div>
      </div>
    );
  }
  return <>{children}</>;
}

function Shell() {
  return (
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="roster" element={<Roster />} />
            <Route path="exchanges" element={<ShiftExchanges />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
