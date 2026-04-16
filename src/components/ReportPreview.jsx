import { computeMeterTotal } from '../../shared/reportUtils';

function display(value, fallback = '-') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function formatReporto(client) {
  return [client?.reportedByName, client?.reportedByArea]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' / ');
}

function signaturePreview(src, label) {
  if (!src) return <span className="preview-signature-empty">{label}</span>;
  return <img src={src} alt={label} className="preview-signature-img" />;
}

export function ReportPreview({ form, onClose }) {
  const meterTotal = computeMeterTotal(form.meters.bn, form.meters.color);
  const partsCount = form.parts.filter((part) => (
    part.numParte || part.cantidad || part.fteCode || part.fteOtherText || part.folio
  )).length;
  const reporto = formatReporto(form.client);

  return (
    <aside className="report-preview-card" aria-label="Previsualizacion del reporte">
      <div className="report-preview-head">
        <div>
          <p className="eyebrow">Vista previa</p>
          <h3>Previsualizacion del reporte</h3>
        </div>
        <div className="preview-head-actions">
          <span className="preview-status">Plantilla Xerox</span>
          {onClose && (
            <button type="button" className="preview-close-btn" onClick={onClose}>
              Ocultar
            </button>
          )}
        </div>
      </div>

      <div className="report-preview-frame">
        <div className="report-preview-page">
          <span className="preview-field preview-task">{display(form.taskNumber, 'T-0000')}</span>
          <span className="preview-field preview-folio">{display(form.reportTechnicalNo, 'RT-0000')}</span>
          <span className="preview-field preview-employee">{display(form.employeeNumber, 'IDS-000')}</span>
          <span className="preview-field preview-business">{display(form.client.businessName, 'Razon social')}</span>
          <span className="preview-field preview-reported">{display(reporto, 'Reporto / Area')}</span>
          <span className="preview-field preview-address">{display(form.client.address, 'Domicilio')}</span>
          <span className="preview-field preview-phone">{display(form.client.phone, 'Telefono')}</span>
          <span className="preview-field preview-city">{display(form.client.cityState, 'Ciudad / Estado')}</span>
          <span className="preview-field preview-model">{display(form.equipment.model, 'Modelo')}</span>
          <span className="preview-field preview-serial">{display(form.equipment.serial, 'Serie')}</span>
          <span className="preview-field preview-meter-bn">{display(form.meters.bn, 'B&N')}</span>
          <span className="preview-field preview-meter-color">{display(form.meters.color, 'Color')}</span>
          <span className="preview-field preview-meter-total">{display(meterTotal, 'Total')}</span>
          <span className="preview-field preview-problem">{display(form.technical.problemReported, 'Problema reportado')}</span>
          <span className="preview-field preview-solution">{display(form.technical.descriptionSolution, 'Descripcion / solucion')}</span>
          <span className="preview-field preview-parts">{partsCount}</span>
          <span className="preview-field preview-client-observation">{display(form.observations.client, 'Observaciones cliente')}</span>
          <span className="preview-field preview-ids-observation">{display(form.observations.ids, 'Observaciones IDS')}</span>
          <div className="preview-signature preview-client-signature">
            {signaturePreview(form.signatures.clientDataUrl, 'Firma cliente')}
          </div>
          <div className="preview-signature preview-engineer-signature">
            {signaturePreview(form.signatures.engineerDataUrl, 'Firma tecnico')}
          </div>
          <span className="preview-field preview-client-name">{display(form.signatures.clientName, 'Nombre cliente')}</span>
          <span className="preview-field preview-engineer-name">{display(form.signatures.engineerName, 'Nombre tecnico')}</span>
        </div>
      </div>

      <p className="report-preview-note">
        Esta miniatura es orientativa; el PDF final se genera con la plantilla completa al guardar.
      </p>
    </aside>
  );
}
