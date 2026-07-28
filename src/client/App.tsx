import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import DashboardPage from './pages/DashboardPage';
import ClassesPage from './pages/ClassesPage';
import ClassDetailPage from './pages/ClassDetailPage';
import QuizPage from './pages/QuizPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminClassPage from './pages/admin/AdminClassPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppShell />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/classes" element={<ClassesPage />} />
                    <Route path="/classes/:id" element={<ClassDetailPage />} />
                    <Route path="/quiz/:id" element={<QuizPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    <Route element={<ProtectedRoute roles={['admin', 'instructor']} />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="/admin/classes/:id" element={<AdminClassPage />} />

                      <Route element={<ProtectedRoute roles={['admin']} />}>
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                      </Route>
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
