import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/FormFields';
import { getReports } from '../lib/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
}

export function ReportHistoryPage() {
  const [filters, setFilters] = useState({
    serial: '',
    clientName: '',
    businessName: '',
    technician: '',
    dateFrom: '',
    dateTo: '',
  });
  const debouncedFilters = useDebouncedValue(filters, 400);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getReports(debouncedFilters);
        if (!active) return;
        setReports(response);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'No se pudo cargar el historial.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [debouncedFilters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Historial</p>
          <h1 className="page-title">Busqueda y consulta de reportes</h1>
        </div>
        <p className="page-copy">
          Filtra por serie, cliente, razon social, tecnico o fechas para revisar el historial guardado en MongoDB.
        </p>
      </div>

      <div className="panel">
        <div className="panel-grid">
          <Input label="Serie" value={filters.serial} onChange={(value) => setFilter('serial', value)} />
          <Input label="Nombre del cliente" value={filters.clientName} onChange={(value) => setFilter('clientName', value)} />
          <Input label="Razon social" value={filters.businessName} onChange={(value) => setFilter('businessName', value)} />
          <Input label="Tecnico" value={filters.technician} onChange={(value) => setFilter('technician', value)} />
          <Input label="Desde" type="date" value={filters.dateFrom} onChange={(value) => setFilter('dateFrom', value)} />
          <Input label="Hasta" type="date" value={filters.dateTo} onChange={(value) => setFilter('dateTo', value)} />
        </div>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {loading && <div className="alert soft-alert">Buscando reportes...</div>}

      <div className="history-grid">
        {!loading && reports.length === 0 && (
          <div className="empty-card">
            <h3>Sin resultados</h3>
            <p>No encontramos reportes con esos filtros.</p>
          </div>
        )}

        {reports.map((report) => (
          <Link key={report.id} to={`/reportes/${report.id}`} className="history-card">
            <div className="history-card-top">
              <span className="history-badge">{report.reportTechnicalNo}</span>
              <span className="history-date">{formatDate(report.reportDate)}</span>
            </div>
            <h3 className="history-title">{report.businessName}</h3>
            <p className="history-serial">{report.model} / {report.serial}</p>
            <div className="history-meta">
              <span>Tecnico: {report.technicianName}</span>
              <span>Cliente: {report.clientName}</span>
              <span>Partes: {report.partsCount}</span>
              <span>Total impresiones: {report.totalMeters || '0'}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
