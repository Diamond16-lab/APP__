import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPdfPayloadFromReport } from '../../shared/reportUtils';
import {
  DatePartsField,
  FieldLabel,
  Input,
  ReadOnlyField,
  SelectField,
  Textarea,
  YesNoField,
} from '../components/FormFields';
import { SignaturePad } from '../components/SignaturePad';
import { ReportPreview } from '../components/ReportPreview';
import { useAuth } from '../context/AuthContext';
import { getCatalogs, createReport, getReportAutocomplete } from '../lib/api';
import {
  SECTION_TITLES,
  buildDemoForm,
  buildReportPayload,
  computeFormTotalMeters,
  createInitialReportForm,
  syncFormWithUser,
  validateEntireReport,
  validateReportStep,
} from '../lib/reportForm';

const CHECKLIST_FIELDS = [
  {
    key: 'bandejas_rotas',
    label: 'Bandejas o partes rotas por operacion',
    trigger: 'SI',
    prompt: 'Especificar actividad y motivo del dano',
  },
  {
    key: 'contacto_electrico',
    label: 'Contacto electrico en buenas condiciones',
    trigger: 'NO',
    prompt: 'Especificar cual',
  },
  {
    key: 'cableado_red',
    label: 'Cableado de red en buenas condiciones',
    trigger: 'NO',
    prompt: 'Especificar problema',
  },
  {
    key: 'problema_operacion',
    label: 'Problema de operacion',
    trigger: 'SI',
    prompt: 'Especificar cual',
  },
  {
    key: 'operador_capacitado',
    label: 'Operador capacitado',
    trigger: 'NO',
    prompt: 'Proporcionar explicacion basica',
  },
  {
    key: 'falta_materiales',
    label: 'Falta de materiales',
    trigger: 'SI',
    prompt: 'Especificar cual',
  },
];

const STEP_HELPERS = [
  'Captura manualmente el numero de reporte. Este campo no se autogenera ni se autocompleta.',
  'Registra los tiempos de viaje y servicio. Los SR extra pueden quedarse vacios si no aplican.',
  'Usa los datos oficiales del cliente; estos se imprimen en el bloque superior del PDF.',
  'El total de medidores se calcula automaticamente con B&N + Color.',
  'Describe el problema y la solucion con claridad; el PDF ajustara el texto al espacio disponible.',
  'Agrega solo las partes usadas. Si FTE es OTRO, escribe el valor real antes de continuar.',
  'Selecciona SI o NO en cada punto para cerrar el checklist final.',
  'Agrega comentarios breves del cliente y del IDS cuando aplique.',
  'Dibuja ambas firmas para habilitar el guardado final y generar el PDF.',
];

const SMART_FILL_MIN_LENGTH = 3;

function isBlank(value) {
  return !String(value ?? '').trim();
}

function setIfBlank(record, path, value, appliedLabels, label) {
  const cleanValue = String(value ?? '').trim();
  if (!cleanValue) return;

  const keys = path.split('.');
  let target = record;

  for (let index = 0; index < keys.length - 1; index += 1) {
    target = target[keys[index]];
  }

  const finalKey = keys[keys.length - 1];
  if (isBlank(target[finalKey])) {
    target[finalKey] = cleanValue;
    appliedLabels.add(label);
  }
}

function mergeRepetitiveSuggestion(current, suggestions) {
  const next = structuredClone(current);
  const appliedLabels = new Set();
  const clientSuggestions = [
    suggestions?.bySerial?.client,
    suggestions?.byBusinessName?.client,
  ].filter(Boolean);
  const serialEquipment = suggestions?.bySerial?.equipment;

  clientSuggestions.forEach((client) => {
    setIfBlank(next, 'client.businessName', client.businessName, appliedLabels, 'datos del cliente');
    setIfBlank(next, 'client.reportedByName', client.reportedByName, appliedLabels, 'datos del cliente');
    setIfBlank(next, 'client.reportedByArea', client.reportedByArea, appliedLabels, 'datos del cliente');
    setIfBlank(next, 'client.address', client.address, appliedLabels, 'datos del cliente');
    setIfBlank(next, 'client.phone', client.phone, appliedLabels, 'datos del cliente');
    setIfBlank(next, 'client.cityState', client.cityState, appliedLabels, 'datos del cliente');
  });

  if (serialEquipment) {
    setIfBlank(next, 'equipment.model', serialEquipment.model, appliedLabels, 'datos del equipo');
    setIfBlank(next, 'equipment.system', serialEquipment.system, appliedLabels, 'datos del equipo');
    setIfBlank(next, 'equipment.subsystem', serialEquipment.subsystem, appliedLabels, 'datos del equipo');
  }

  return {
    form: next,
    appliedLabels: Array.from(appliedLabels),
  };
}

function StepCircle({ stepNumber, currentStep, onJump }) {
  const active = stepNumber === currentStep;
  const done = stepNumber < currentStep;

  return (
    <button
      type="button"
      className={`step-circle${active ? ' step-active' : done ? ' step-done' : ' step-pending'}`}
      onClick={() => {
        if (done) onJump(stepNumber);
      }}
    >
      {done ? 'OK' : stepNumber}
    </button>
  );
}

export function ReportFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [catalogs, setCatalogs] = useState({ systems: [], subsystems: [], fteOptions: [] });
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [form, setForm] = useState(() => createInitialReportForm(user));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [smartFillNote, setSmartFillNote] = useState('');
  const sectionTopRef = useRef(null);
  const formRef = useRef(form);
  const lastSmartFillKeyRef = useRef('');

  useEffect(() => {
    setForm((current) => syncFormWithUser(current, user));
  }, [user]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    sectionTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoadingCatalogs(true);

      try {
        const response = await getCatalogs();
        if (!active) return;
        setCatalogs(response);
      } catch (catalogError) {
        if (!active) return;
        setError(catalogError.message || 'No se pudieron cargar los catalogos.');
      } finally {
        if (active) {
          setLoadingCatalogs(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const serial = form.equipment.serial.trim();
    const businessName = form.client.businessName.trim();
    const canSearch = serial.length >= SMART_FILL_MIN_LENGTH || businessName.length >= SMART_FILL_MIN_LENGTH;

    if (!canSearch) {
      setSmartFillNote('');
      return undefined;
    }

    const smartFillKey = `${serial}::${businessName}`;
    if (lastSmartFillKeyRef.current === smartFillKey) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const suggestions = await getReportAutocomplete({ serial, businessName });
        if (!active) return;

        lastSmartFillKeyRef.current = smartFillKey;

        const latestForm = formRef.current;
        const stillSameSearch = (
          latestForm.equipment.serial.trim() === serial &&
          latestForm.client.businessName.trim() === businessName
        );

        if (!stillSameSearch) return;

        const hasSuggestion = suggestions.bySerial || suggestions.byBusinessName;
        const result = mergeRepetitiveSuggestion(latestForm, suggestions);

        if (result.appliedLabels.length > 0) {
          setForm(result.form);
          setSmartFillNote(
            `Autollenado inteligente: ${result.appliedLabels.join(' y ')} desde reportes anteriores. El numero de reporte queda manual.`,
          );
          return;
        }

        setSmartFillNote(hasSuggestion ? 'Hay historial relacionado, pero no se reemplazaron campos que ya capturaste.' : '');
      } catch {
        if (active) setSmartFillNote('');
      }
    }, 550);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.client.businessName, form.equipment.serial]);

  const progress = ((step - 1) / (SECTION_TITLES.length - 1)) * 100;
  const meterTotal = computeFormTotalMeters(form);

  const setField = (path, value) => {
    setForm((current) => {
      const clone = structuredClone(current);
      const keys = path.split('.');
      let target = clone;

      for (let index = 0; index < keys.length - 1; index += 1) {
        target = target[keys[index]];
      }

      target[keys[keys.length - 1]] = value;
      return clone;
    });
  };

  const setPartField = (index, key, value) => {
    setForm((current) => ({
      ...current,
      parts: current.parts.map((part, partIndex) => (
        partIndex === index ? { ...part, [key]: value } : part
      )),
    }));
  };

  const addPart = () => {
    setForm((current) => ({
      ...current,
      parts: [...current.parts, { numParte: '', cantidad: '', fteCode: '', fteOtherText: '', folio: '' }],
    }));
  };

  const removePart = (index) => {
    setForm((current) => ({
      ...current,
      parts: current.parts.filter((_, partIndex) => partIndex !== index),
    }));
  };

  const fillDemo = () => {
    setForm(buildDemoForm(user));
    setError('');
    setStep(1);
  };

  const validateCurrentStep = () => {
    const missing = validateReportStep(step, form);
    if (missing.length > 0) {
      setError(`Completa los campos requeridos: ${missing.join(', ')}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (step < SECTION_TITLES.length) setStep((current) => current + 1);
  };

  const handleSubmit = async () => {
    const missing = validateEntireReport(form);
    if (missing.length > 0) {
      setError(`Completa los campos requeridos: ${missing.join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = buildReportPayload(form);
      const savedReport = await createReport(payload);
      const { generarPDF } = await import('../generarPDF');
      await generarPDF(buildPdfPayloadFromReport(savedReport));
      navigate(`/reportes/${savedReport.id}`, {
        replace: true,
        state: { justCreated: true },
      });
    } catch (submissionError) {
      const backendErrors = submissionError?.payload?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        setError(`No se pudo guardar el reporte: ${backendErrors.join(', ')}`);
      } else {
        setError(submissionError.message || 'No se pudo guardar el reporte.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Nuevo reporte tecnico</h1>
            <p className="header-sub">Captura guiada, guardado en MongoDB y PDF final con formato Xerox.</p>
          </div>
          <div className="header-actions">
            <span className={`header-badge${form.reportTechnicalNo ? '' : ' header-badge-pending'}`}>
              {form.reportTechnicalNo || 'Numero pendiente'}
            </span>
            <button type="button" className="ghost-btn light-ghost" onClick={fillDemo}>
              Rellenar demo
            </button>
            <button
              type="button"
              className="ghost-btn light-ghost preview-toggle-header"
              onClick={() => setShowPreview((current) => !current)}
              aria-expanded={showPreview}
            >
              {showPreview ? 'Ocultar vista' : 'Vista previa'}
            </button>
          </div>
        </div>

        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="steps-row">
          {SECTION_TITLES.map((_, index) => (
            <StepCircle key={index + 1} stepNumber={index + 1} currentStep={step} onJump={setStep} />
          ))}
        </div>
      </header>

      <main className="main-content">
        <div className="form-helper-card" ref={sectionTopRef}>
          <div>
            <span className="form-helper-step">Paso {step} de {SECTION_TITLES.length}</span>
            <strong>{SECTION_TITLES[step - 1]}</strong>
            <p>{STEP_HELPERS[step - 1]}</p>
          </div>
          <button
            type="button"
            className="ghost-btn preview-toggle-btn"
            onClick={() => setShowPreview((current) => !current)}
            aria-expanded={showPreview}
          >
            {showPreview ? 'Ocultar previsualizacion' : 'Ver previsualizacion'}
          </button>
        </div>

        {showPreview && <ReportPreview form={form} onClose={() => setShowPreview(false)} />}

        <div className="section-card">
          <h2 className="section-title">
            <span className="section-num">{step}</span>
            {SECTION_TITLES[step - 1]}
          </h2>

          {loadingCatalogs && <div className="alert soft-alert">Cargando catalogos...</div>}
          {smartFillNote && <div className="alert smart-fill-alert">{smartFillNote}</div>}
          {error && <div className="alert error-alert">{error}</div>}

          {step === 1 && (
            <div className="fields">
              <Input
                label="Numero de tarea"
                required
                value={form.taskNumber}
                onChange={(value) => setField('taskNumber', value)}
                placeholder="Ej: T-2026-001"
                hint="Este dato aparece en la parte superior izquierda del reporte."
              />
              <Input
                label="Numero de reporte"
                required
                value={form.reportTechnicalNo}
                onChange={(value) => setField('reportTechnicalNo', value)}
                placeholder="Ej: RT-20260408-001"
                hint="Capturalo manualmente. Este campo no usa autollenado ni historial."
                autoComplete="off"
                name="manual-report-number"
                spellCheck={false}
              />
              <ReadOnlyField label="Numero de empleado (Nomina RT)" value={form.employeeNumber} />
              <div className="field-group">
                <FieldLabel text="Fecha recibida" />
                <DatePartsField
                  value={form.received}
                  onChange={(key, value) => setField(`received.${key}`, value)}
                />
                <div className="field-group">
                  <FieldLabel text="Hora" />
                  <input
                    className="input"
                    type="time"
                    value={form.received.hora}
                    onChange={(event) => setField('received.hora', event.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <FieldLabel text="Fecha documentada" />
                <DatePartsField
                  value={form.documented}
                  onChange={(key, value) => setField(`documented.${key}`, value)}
                />
                <div className="field-group">
                  <FieldLabel text="Hora" />
                  <input
                    className="input"
                    type="time"
                    value={form.documented.hora}
                    onChange={(event) => setField('documented.hora', event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fields">
              <div className="subsection-title">Viaje</div>
              <DatePartsField
                label="Fecha de viaje"
                value={form.activities.viaje}
                onChange={(key, value) => setField(`activities.viaje.${key}`, value)}
              />
              <div className="two-col">
                <Input
                  label="Hora inicio"
                  required
                  value={form.activities.viaje.inicio}
                  onChange={(value) => setField('activities.viaje.inicio', value)}
                  type="time"
                />
                <Input
                  label="Hora fin"
                  required
                  value={form.activities.viaje.fin}
                  onChange={(value) => setField('activities.viaje.fin', value)}
                  type="time"
                />
              </div>

              {['sr1', 'sr2', 'sr3'].map((key, index) => (
                <div key={key} className="sr-block">
                  <div className="subsection-title">SR {index + 1}</div>
                  <DatePartsField
                    label={`Fecha SR ${index + 1}`}
                    value={form.activities[key]}
                    onChange={(field, value) => setField(`activities.${key}.${field}`, value)}
                  />
                  <div className="two-col">
                    <Input
                      label="Hora inicio"
                      value={form.activities[key].inicio}
                      onChange={(value) => setField(`activities.${key}.inicio`, value)}
                      type="time"
                    />
                    <Input
                      label="Hora fin"
                      value={form.activities[key].fin}
                      onChange={(value) => setField(`activities.${key}.fin`, value)}
                      type="time"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="fields">
              <Input
                label="Razon social"
                required
                value={form.client.businessName}
                onChange={(value) => setField('client.businessName', value)}
                placeholder="Nombre de la empresa"
                hint="Se usara para el PDF y para buscar en historial."
              />
              <div className="two-col">
                <Input
                  label="Reporto - Nombre"
                  required
                  value={form.client.reportedByName}
                  onChange={(value) => setField('client.reportedByName', value)}
                />
                <Input
                  label="Reporto - Area"
                  value={form.client.reportedByArea}
                  onChange={(value) => setField('client.reportedByArea', value)}
                />
              </div>
              <Input
                label="Domicilio"
                required
                value={form.client.address}
                onChange={(value) => setField('client.address', value)}
              />
              <div className="two-col">
                <Input
                  label="Telefono / Ext."
                  required
                  value={form.client.phone}
                  onChange={(value) => setField('client.phone', value)}
                  placeholder="Ej: 686-555-1234 Ext. 310"
                />
                <Input
                  label="Ciudad / Estado"
                  required
                  value={form.client.cityState}
                  onChange={(value) => setField('client.cityState', value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="fields">
              <Input
                label="Modelo del equipo"
                required
                value={form.equipment.model}
                onChange={(value) => setField('equipment.model', value)}
              />
              <Input
                label="Serie"
                required
                value={form.equipment.serial}
                onChange={(value) => setField('equipment.serial', value)}
                hint="La comparacion automatica usa esta serie para encontrar reportes anteriores."
              />

              <div className="subsection-title">Medidores</div>
              <div className="three-col">
                <Input
                  label="B&N"
                  value={form.meters.bn}
                  onChange={(value) => setField('meters.bn', value)}
                  type="number"
                  placeholder="0"
                  inputMode="numeric"
                />
                <Input
                  label="Color"
                  value={form.meters.color}
                  onChange={(value) => setField('meters.color', value)}
                  type="number"
                  placeholder="0"
                  inputMode="numeric"
                />
                <Input
                  label="Total"
                  value={meterTotal}
                  onChange={() => {}}
                  readOnly
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="fields">
              <Textarea
                label="Problema reportado"
                required
                value={form.technical.problemReported}
                onChange={(value) => setField('technical.problemReported', value)}
                rows={3}
                placeholder="Describe lo que reporto el cliente."
              />
              <YesNoField
                label="Llamada incompleta"
                required
                value={form.technical.incompleteCall}
                onChange={(value) => setField('technical.incompleteCall', value)}
              />
              {form.technical.incompleteCall === 'SI' && (
                <div className="indent">
                  <SelectField
                    label="Motivo"
                    value={form.technical.incompleteCallReason}
                    onChange={(value) => setField('technical.incompleteCallReason', value)}
                    options={['X Partes', 'X Tiempo', 'X Asesoria']}
                  />
                </div>
              )}
              <YesNoField
                label="Equipo funciona"
                required
                value={form.technical.equipmentWorks}
                onChange={(value) => setField('technical.equipmentWorks', value)}
              />
              <Input
                label="Problema encontrado"
                value={form.technical.problemFound}
                onChange={(value) => setField('technical.problemFound', value)}
              />
              <div className="two-col">
                <Input
                  label="Codigo de falla"
                  value={form.technical.faultCode}
                  onChange={(value) => setField('technical.faultCode', value)}
                />
                <SelectField
                  label="Sistema"
                  value={form.equipment.system}
                  onChange={(value) => setField('equipment.system', value)}
                  options={catalogs.systems}
                />
              </div>
              <SelectField
                label="Subsistema"
                value={form.equipment.subsystem}
                onChange={(value) => setField('equipment.subsystem', value)}
                options={catalogs.subsystems}
              />
              <Textarea
                label="Descripcion del problema / solucion"
                required
                value={form.technical.descriptionSolution}
                onChange={(value) => setField('technical.descriptionSolution', value)}
                rows={5}
                placeholder="Describe diagnostico, acciones realizadas, pruebas y resultado final."
              />
            </div>
          )}

          {step === 6 && (
            <div className="fields">
              <p className="section-hint">
                Las partes siguen siendo opcionales, pero FTE ahora usa catalogo y OTRO requiere texto adicional.
              </p>

              {form.parts.map((part, index) => (
                <div key={index} className="parte-row">
                  <div className="parte-header">
                    <span className="parte-num">Parte {index + 1}</span>
                    {form.parts.length > 1 && (
                      <button type="button" className="btn-remove" onClick={() => removePart(index)}>
                        X
                      </button>
                    )}
                  </div>

                  <div className="two-col">
                    <Input
                      label="Num. de parte"
                      value={part.numParte}
                      onChange={(value) => setPartField(index, 'numParte', value)}
                    />
                    <Input
                      label="Cantidad"
                      value={part.cantidad}
                      onChange={(value) => setPartField(index, 'cantidad', value)}
                      type="number"
                    />
                  </div>

                  <div className="two-col">
                    <SelectField
                      label="FTE"
                      value={part.fteCode}
                      onChange={(value) => setPartField(index, 'fteCode', value)}
                      options={catalogs.fteOptions}
                    />
                    <Input
                      label="Folio"
                      value={part.folio}
                      onChange={(value) => setPartField(index, 'folio', value)}
                    />
                  </div>

                  {part.fteCode === 'OTRO' && (
                    <Input
                      label="FTE personalizado"
                      required
                      value={part.fteOtherText}
                      onChange={(value) => setPartField(index, 'fteOtherText', value)}
                      placeholder="Escribe el FTE real"
                    />
                  )}
                </div>
              ))}

              <button type="button" className="btn-add-parte" onClick={addPart}>
                + Agregar parte
              </button>
            </div>
          )}

          {step === 7 && (
            <div className="fields">
              <p className="section-hint">Todos los SI/NO de esta seccion son obligatorios.</p>

              {CHECKLIST_FIELDS.map((field) => (
                <div key={field.key}>
                  <YesNoField
                    label={field.label}
                    required
                    value={form.checklist[field.key].valor}
                    onChange={(value) => setField(`checklist.${field.key}.valor`, value)}
                  />

                  {form.checklist[field.key].valor === field.trigger && (
                    <div className="indent">
                      <Input
                        label={field.prompt}
                        value={form.checklist[field.key].comentario}
                        onChange={(value) => setField(`checklist.${field.key}.comentario`, value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 8 && (
            <div className="fields">
              <Textarea
                label="Observaciones / Comentarios del cliente"
                value={form.observations.client}
                onChange={(value) => setField('observations.client', value)}
                rows={4}
              />
              <Textarea
                label="Observaciones / Comentarios del IDS"
                value={form.observations.ids}
                onChange={(value) => setField('observations.ids', value)}
                rows={4}
              />
            </div>
          )}

          {step === 9 && (
            <div className="fields">
              <div className="conf-text">
                El equipo ha quedado reparado y funcionando en todos sus modos a mi entera satisfaccion,
                utilizandose las refacciones senaladas en el presente reporte.
              </div>

              <Input
                label="Nombre del cliente"
                required
                value={form.signatures.clientName}
                onChange={(value) => setField('signatures.clientName', value)}
              />
              <ReadOnlyField label="Nombre del ingeniero de servicio" value={form.signatures.engineerName} />

              <SignaturePad
                label="Firma del cliente"
                value={form.signatures.clientDataUrl}
                onChange={(value) => setField('signatures.clientDataUrl', value)}
              />
              <SignaturePad
                label="Firma del tecnico"
                value={form.signatures.engineerDataUrl}
                onChange={(value) => setField('signatures.engineerDataUrl', value)}
              />

              <button type="button" className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Guardando reporte...' : 'Guardar reporte y generar PDF'}
              </button>
            </div>
          )}
        </div>
      </main>

      <nav className="bottom-nav">
        <button
          type="button"
          className={`nav-btn nav-prev${step === 1 ? ' nav-disabled' : ''}`}
          onClick={() => step > 1 && setStep((current) => current - 1)}
          disabled={step === 1}
        >
          Anterior
        </button>
        <span className="nav-step-label">{step} / {SECTION_TITLES.length}</span>
        {step < SECTION_TITLES.length ? (
          <button type="button" className="nav-btn nav-next" onClick={handleNext}>
            Siguiente
          </button>
        ) : (
          <div className="nav-spacer" />
        )}
      </nav>
    </div>
  );
}
