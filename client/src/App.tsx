import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import AppLayout from './components/layout/AppLayout';
import AddPlacePage from './pages/addPlace/AddPlacePage';
import ProfilePage from './pages/profile/ProfilePage';

// 🔐 ProtectedRoute — only lets logged-in users through.
//    If not logged in → sends them to /login.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// 🔓 PublicRoute — only renders for guests (not logged in).
//    If already logged in → sends them to / (home).
//    This prevents a logged-in user from seeing the login/register page.
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — guests only */}
          <Route path="/login" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />

          {/* Protected routes — must be logged in */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <div>Home (coming soon)</div>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute>
              <AppLayout>
                <AddPlacePage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/places" element={
            <ProtectedRoute>
              <AppLayout>
                <div>My Places (coming soon)</div>
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all: unknown URL → login (works for both guests and logged-in users) */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
