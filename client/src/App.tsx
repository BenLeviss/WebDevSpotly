import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import AppLayout from './components/layout/AppLayout';
import AddPlacePage from './pages/addPlace/AddPlacePage';
import ProfilePage from './pages/profile/ProfilePage';
import HomePage from './pages/home/HomePage';
import MyPlacesPage from './pages/myPlaces/MyPlacesPage';
import EditPlacePage from './pages/editPlace/EditPlacePage';
import PostCommentsPage from './pages/postComments/PostCommentsPage';

// 🔐 ProtectedRoute — only lets logged-in users through.
//    If not logged in (no user OR no token) → sends them to /login.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  return user && accessToken ? <>{children}</> : <Navigate to="/login" replace />;
}

// 🔓 PublicRoute — only renders for guests (not logged in).
//    If already logged in → sends them to / (home).
//    This prevents a logged-in user from seeing the login/register page.
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  return user && accessToken ? <Navigate to="/" replace /> : <>{children}</>;
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
                <HomePage />
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
                <MyPlacesPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/places/:postId/edit" element={
            <ProtectedRoute>
              <AppLayout>
                <EditPlacePage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/post/:postId/comments" element={
            <ProtectedRoute>
              <AppLayout>
                <PostCommentsPage />
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
