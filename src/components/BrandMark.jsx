import { useState } from 'react';

export function BrandMark({ compact = false }) {
  const [imageMissing, setImageMissing] = useState(false);

  return (
    <div className={`brand-mark${compact ? ' brand-mark-compact' : ''}`}>
      {!imageMissing && (
        <img
          src="/company-logo.png"
          alt="Logo empresa"
          className="brand-logo"
          onError={() => setImageMissing(true)}
        />
      )}
      {imageMissing && (
        <div className="brand-logo-fallback" aria-label="Xerox">
          xerox
        </div>
      )}
      <div className="brand-copy">
        <span className="brand-kicker">Xerox Service</span>
        <strong className="brand-title">Reporte tecnico</strong>
      </div>
    </div>
  );
}
