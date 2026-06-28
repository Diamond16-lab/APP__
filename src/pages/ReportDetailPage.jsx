import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { buildPdfPayloadFromReport } from '../../shared/reportUtils';
import { getReportById, getReportComparison } from '../lib/api';

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
}

function DeltaCard({ label, value }) {
  const positive = value >= 0;
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className={`stat-value${positive ? ' stat-positive' : ' stat-negative'}`}>
        {positive ? '+' : ''}{value}
      </strong>
    </div>
  );
}

export function ReportDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setError('');

      try {
        const [reportResponse, comparisonResponse] = await Promise.all([
          getReportById(id),
          getReportComparison(id),
        ]);
        if (!active) return;
        setReport(reportResponse);
        setComparison(comparisonResponse);
      } catch (requestError) {
        if (!active) return;
        setError(requestError.message || 'No se pudo cargar el reporte.');
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
  }, [id]);

  const handleDownload = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const { generarPDF } = await import('../generarPDF');
      await generarPDF(buildPdfPayloadFromReport(report));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="alert soft-alert">Cargando detalle...</div>;
  }

  if (error) {
    return <div className="alert error-alert">{error}</div>;
  }

  if (!report) {
    return <div className="empty-card">No encontramos el reporte solicitado.</div>;
  }

  return (
    <section className="page-stack">
      {location.state?.justCreated && (
        <div className="alert success-alert">
          {location.state?.pdfWarning
            ? 'El reporte se guardo correctamente en MongoDB.'
            : 'El reporte se guardo en MongoDB y el PDF se genero con esos datos persistidos.'}
        </div>
      )}
      {location.state?.pdfWarning && (
        <div className="alert soft-alert">
          {location.state.pdfWarning}
        </div>
      )}

      <div className="page-heading detail-heading">
        <div>
          <p className="eyebrow">Detalle</p>
          <h1 className="page-title">{report.reportTechnicalNo}</h1>
          <p className="page-copy">{report.client.businessName} / {report.equipment.model} / {report.equipment.serial}</p>
        </div>

        <div className="detail-actions">
          <Link to="/reportes" className="ghost-btn dark-ghost">Volver al historial</Link>
          <button type="button" className="btn-submit small-submit" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Resumen del reporte</h2>
          <div className="info-grid">
            <div><span>Numero de tarea</span><strong>{report.taskNumber}</strong></div>
            <div><span>Fecha</span><strong>{formatDate(report.reportDate)}</strong></div>
            <div><span>Tecnico</span><strong>{report.technicianName}</strong></div>
            <div><span>Empleado</span><strong>{report.employeeNumber}</strong></div>
            <div><span>Generado por</span><strong>{report.generatedBy?.fullName || report.technicianName}</strong></div>
            <div><span>Generado el</span><strong>{formatDate(report.generatedAt || report.createdAt)}</strong></div>
            <div><span>Sistema</span><strong>{report.equipment.system || 'Sin dato'}</strong></div>
            <div><span>Subsistema</span><strong>{report.equipment.subsystem || 'Sin dato'}</strong></div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Medidores</h2>
          <div className="stats-grid">
            <div className="stat-card"><span className="stat-label">B&N</span><strong className="stat-value">{report.meters.bn || '0'}</strong></div>
            <div className="stat-card"><span className="stat-label">Color</span><strong className="stat-value">{report.meters.color || '0'}</strong></div>
            <div className="stat-card"><span className="stat-label">Total</span><strong className="stat-value">{report.meters.total || '0'}</strong></div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Comparacion contra el ultimo reporte de la misma serie</h2>
        {comparison?.previousReport ? (
          <>
            <p className="panel-copy">
              Reporte previo: <strong>{comparison.previousReport.reportTechnicalNo}</strong> / {formatDate(comparison.previousReport.reportDate)}
            </p>
            <div className="stats-grid">
              <DeltaCard label="Delta B&N" value={comparison.deltas.bn} />
              <DeltaCard label="Delta Color" value={comparison.deltas.color} />
              <DeltaCard label="Delta Total" value={comparison.deltas.total} />
            </div>
          </>
        ) : (
          <p className="panel-copy">No existe un reporte anterior para esta serie, asi que aun no hay comparacion automatica.</p>
        )}
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Diagnostico tecnico</h2>
          <div className="stack-copy">
            <div>
              <span>Problema reportado</span>
              <p>{report.technical.problemReported}</p>
            </div>
            <div>
              <span>Problema encontrado</span>
              <p>{report.technical.problemFound || 'Sin dato'}</p>
            </div>
            <div>
              <span>Codigo de falla</span>
              <p>{report.technical.faultCode || 'Sin dato'}</p>
            </div>
            <div>
              <span>Descripcion / Solucion</span>
              <p>{report.technical.descriptionSolution}</p>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Observaciones y checklist</h2>
          <div className="stack-copy">
            <div>
              <span>Observaciones cliente</span>
              <p>{report.observations.client || 'Sin dato'}</p>
            </div>
            <div>
              <span>Observaciones IDS</span>
              <p>{report.observations.ids || 'Sin dato'}</p>
            </div>
            {Object.entries(report.checklist).map(([key, entry]) => (
              <div key={key}>
                <span>{key.replaceAll('_', ' ')}</span>
                <p>{entry.valor || 'Sin dato'}{entry.comentario ? ` / ${entry.comentario}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Partes de este reporte</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Num. parte</th>
                  <th>Cant.</th>
                  <th>FTE</th>
                  <th>Folio</th>
                </tr>
              </thead>
              <tbody>
                {report.parts.length === 0 && (
                  <tr>
                    <td colSpan="4">Sin partes registradas.</td>
                  </tr>
                )}
                {report.parts.map((part, index) => (
                  <tr key={`${part.numParte}-${index}`}>
                    <td>{part.numParte || '-'}</td>
                    <td>{part.cantidad || '-'}</td>
                    <td>{part.fteDisplay || part.fteCode || '-'}</td>
                    <td>{part.folio || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Historial de partes por equipo</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Num. parte</th>
                  <th>Total usado</th>
                  <th>Ultimo uso</th>
                  <th>Ultimo folio</th>
                </tr>
              </thead>
              <tbody>
                {comparison?.partHistory?.length ? comparison.partHistory.map((part) => (
                  <tr key={part.numParte}>
                    <td>{part.numParte}</td>
                    <td>{part.totalQuantity}</td>
                    <td>{formatDate(part.lastUsedAt)}</td>
                    <td>{part.lastFolio || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4">Aun no hay historial acumulado de partes para esta serie.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2 className="panel-title">Firma del cliente</h2>
          <div className="signature-preview">
            <img src={report.signatures.clientDataUrl} alt="Firma cliente" className="signature-image" />
            <strong>{report.signatures.clientName}</strong>
          </div>
        </div>
        <div className="panel">
          <h2 className="panel-title">Firma del tecnico</h2>
          <div className="signature-preview">
            <img src={report.signatures.engineerDataUrl} alt="Firma tecnico" className="signature-image" />
            <strong>{report.signatures.engineerName}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
