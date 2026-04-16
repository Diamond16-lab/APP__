import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from './BrandMark';

function formatSessionTime(date) {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionTime, setSessionTime] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSessionTime(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-bar">
          <BrandMark compact />

          <nav className="shell-nav">
            <NavLink to="/reportes/nuevo" className={({ isActive }) => `shell-link${isActive ? ' shell-link-active' : ''}`}>
              Nuevo reporte
            </NavLink>
            <NavLink
              to="/reportes"
              end
              className={({ isActive }) => `shell-link${isActive ? ' shell-link-active' : ''}`}
            >
              Historial
            </NavLink>
          </nav>

          <div className="shell-account">
            <div className="shell-user-card">
              <span className="shell-avatar">{user?.displayName?.slice(0, 1) || 'T'}</span>
              <div>
                <p className="shell-user">{user?.displayName}</p>
                <p className="shell-user-sub">Empleado: {user?.employeeNumber}</p>
                <time className="shell-session-time" dateTime={sessionTime.toISOString()}>
                  {formatSessionTime(sessionTime)}
                </time>
              </div>
            </div>
            <button type="button" className="ghost-btn shell-logout" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
