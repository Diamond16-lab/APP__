import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from '../components/BrandMark';
import { Input } from '../components/FormFields';
import { LoadingScreen } from '../components/LoadingScreen';

export function LoginPage() {
  const { user, booting, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (booting) {
    return <LoadingScreen text="Cargando acceso..." />;
  }

  if (user) {
    return <Navigate to={location.state?.from || '/reportes/nuevo'} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(username, password);
      navigate(location.state?.from || '/reportes/nuevo', { replace: true });
    } catch (submissionError) {
      setError(submissionError.message || 'No se pudo iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccess = () => {
    setUsername('admin');
    setPassword('Admin123!');
    setError('');
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-hero">
          <div>
            <BrandMark />
            <div className="login-hero-copy">
              <p className="eyebrow light-eyebrow">Portal de servicio</p>
              <h1 className="login-title">Reportes tecnicos Xerox, listos para guardar y consultar.</h1>
              <p className="login-copy">
                Captura el servicio, firma en pantalla y genera el PDF con el formato oficial sin perder el historial.
              </p>
            </div>
          </div>

          <div className="login-feature-list">
            <span>PDF con plantilla Xerox</span>
            <span>Historial conectado a MongoDB</span>
            <span>Comparacion automatica por serie</span>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Acceso seguro</p>
            <h2 className="card-title">Bienvenido</h2>
            <p className="card-copy">
              Ingresa con tu usuario tecnico. Para pruebas locales puedes rellenar el acceso demo.
            </p>
          </div>

          <Input
            label="Usuario"
            required
            value={username}
            onChange={setUsername}
            placeholder="admin"
            autoComplete="username"
          />
          <Input
            label="Contrasena"
            required
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="Tu contrasena"
            autoComplete="current-password"
          />

          {error && <div className="alert error-alert">{error}</div>}

          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>

          <button type="button" className="ghost-btn wide-ghost" onClick={fillDemoAccess}>
            Usar acceso de prueba
          </button>

          <div className="login-hint">
            Usuario inicial por defecto: <strong>admin</strong> / Contrasena: <strong>Admin123!</strong>
          </div>
        </form>
      </div>
    </div>
  );
}
