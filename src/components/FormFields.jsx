import { DIAS, MESES, ANIOS } from '../lib/reportForm';

export function FieldLabel({ text, required }) {
  return (
    <label className="field-label">
      {text}
      {required && <span className="req">*</span>}
    </label>
  );
}

export function Input({
  label,
  required,
  value,
  onChange,
  type = 'text',
  placeholder,
  readOnly,
  hint,
  autoComplete = 'off',
  inputMode,
  name,
  spellCheck,
}) {
  return (
    <div className="field-group">
      {label && <FieldLabel text={label} required={required} />}
      <input
        className={`input${required && !value ? ' input-error' : ''}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || ''}
        readOnly={readOnly}
        autoComplete={autoComplete}
        inputMode={inputMode}
        name={name}
        spellCheck={spellCheck}
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, required, value, onChange, rows = 3, placeholder, hint }) {
  return (
    <div className="field-group">
      {label && <FieldLabel text={label} required={required} />}
      <textarea
        className={`textarea${required && !value ? ' input-error' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder || ''}
        autoComplete="off"
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opcion...',
}) {
  return (
    <div className="field-group">
      {label && <FieldLabel text={label} required={required} />}
      <select className="select" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const current = typeof option === 'string'
            ? { value: option, label: option }
            : option;
          return (
            <option key={current.value} value={current.value}>
              {current.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function ReadOnlyField({ label, value }) {
  return (
    <div className="field-group">
      <FieldLabel text={label} />
      <div className="readonly-field">{value}</div>
    </div>
  );
}

export function DatePartsField({ label, value, onChange }) {
  return (
    <div className="field-group">
      {label && <FieldLabel text={label} />}
      <div className="fecha-row">
        <select className="select select-sm" value={value.dia} onChange={(event) => onChange('dia', event.target.value)}>
          <option value="">Dia</option>
          {DIAS.map((day) => (
            <option key={day} value={String(day)}>{day}</option>
          ))}
        </select>
        <select className="select select-sm" value={value.mes} onChange={(event) => onChange('mes', event.target.value)}>
          <option value="">Mes</option>
          {MESES.map((month) => (
            <option key={month.v} value={month.v}>{month.l}</option>
          ))}
        </select>
        <select className="select select-sm" value={value.anio} onChange={(event) => onChange('anio', event.target.value)}>
          <option value="">Anio</option>
          {ANIOS.map((year) => (
            <option key={year} value={String(year)}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function YesNoField({ label, value, onChange, required }) {
  return (
    <div className="field-group">
      <FieldLabel text={label} required={required} />
      <div className="sino-row">
        <button
          type="button"
          className={`sino-btn${value === 'SI' ? ' sino-si' : ''}`}
          onClick={() => onChange('SI')}
        >
          SI
        </button>
        <button
          type="button"
          className={`sino-btn${value === 'NO' ? ' sino-no' : ''}`}
          onClick={() => onChange('NO')}
        >
          NO
        </button>
      </div>
    </div>
  );
}
