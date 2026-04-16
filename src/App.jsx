import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AppShell } from './components/AppShell';
import { LoadingScreen } from './components/LoadingScreen';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';

function AppRoutes() {
  const { booting } = useAuth();

  if (booting) {
    return <LoadingScreen text="Cargando aplicacion..." />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/reportes/nuevo" replace />} />
          <Route path="/reportes" element={<ReportHistoryPage />} />
          <Route path="/reportes/nuevo" element={<ReportFormPage />} />
          <Route path="/reportes/:id" element={<ReportDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
