import { useEffect, useRef } from 'react';

function getPosition(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function SignaturePad({
  label,
  value,
  onChange,
  hint = 'Dibuja tu firma dentro del recuadro.',
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const pointerIdRef = useRef(null);
  const hasStrokeRef = useRef(Boolean(value));
  const hasInk = Boolean(value);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
    context.lineWidth = 2.8;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!value) {
      hasStrokeRef.current = false;
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      hasStrokeRef.current = true;
    };
    image.src = value;
  }, [value]);

  const commit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasStrokeRef.current) {
      onChange('');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const finishStroke = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointerId = event?.pointerId;
    if (pointerId !== undefined && pointerId !== null && pointerIdRef.current !== pointerId) {
      return;
    }

    if (pointerId !== undefined && pointerId !== null && canvas.hasPointerCapture?.(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }

    drawingRef.current = false;
    lastPointRef.current = null;
    pointerIdRef.current = null;
    commit();
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPosition(event, canvas);
    hasStrokeRef.current = true;
    context.beginPath();
    context.arc(lastPointRef.current.x, lastPointRef.current.y, 1.2, 0, Math.PI * 2);
    context.fillStyle = '#0f172a';
    context.fill();
  };

  const handlePointerMove = (event) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!drawingRef.current || !canvas || !context || pointerIdRef.current !== event.pointerId) return;

    const currentPoint = getPosition(event, canvas);
    const lastPoint = lastPointRef.current || currentPoint;

    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(currentPoint.x, currentPoint.y);
    context.stroke();

    lastPointRef.current = currentPoint;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!drawingRef.current) return;
      if (document.visibilityState === 'visible') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (pointerIdRef.current !== null && canvas.hasPointerCapture?.(pointerIdRef.current)) {
        canvas.releasePointerCapture(pointerIdRef.current);
      }

      drawingRef.current = false;
      lastPointRef.current = null;
      pointerIdRef.current = null;

      if (!hasStrokeRef.current) {
        onChange('');
        return;
      }

      onChange(canvas.toDataURL('image/png'));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onChange]);

  const handlePointerUp = (event) => {
    finishStroke(event);
  };

  const handlePointerCancel = (event) => {
    finishStroke(event);
  };

  const handleLostPointerCapture = () => {
    if (!drawingRef.current) return;
    if (pointerIdRef.current === null) return;
    finishStroke({ pointerId: pointerIdRef.current });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    if (pointerIdRef.current !== null && canvas.hasPointerCapture?.(pointerIdRef.current)) {
      canvas.releasePointerCapture(pointerIdRef.current);
    }

    pointerIdRef.current = null;
    drawingRef.current = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    lastPointRef.current = null;
    hasStrokeRef.current = false;
    onChange('');
  };

  return (
    <div className="signature-pad">
      <div className="signature-head">
        <div>
          <label className="field-label">{label}</label>
          <p className="signature-hint">{hint}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={handleClear}>
          Limpiar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={190}
        className={`signature-canvas${hasInk ? ' signature-canvas-signed' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
      />
    </div>
  );
}
