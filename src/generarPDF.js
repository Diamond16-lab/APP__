import { jsPDF } from 'jspdf';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

const TEMPLATE_BROWSER_SRC = '/reporte-template.png';
const TEMPLATE_NODE_URL = new URL('../public/reporte-template.png', import.meta.url);
const importNodeModule = new Function('specifier', 'return import(specifier)');

const TOP_INFO_ROWS = [
  [45.7, 56.5],
  [56.5, 67.3],
  [67.3, 78.1],
];

const ACTIVITY_ROWS = [
  [78.1, 88.9],
  [88.9, 99.7],
  [99.7, 110.5],
  [110.5, 121.3],
];

const TOP_INFO_VALUE = { left: 151.1, right: 253.8 };
const ACTIVITY_COLS = [
  [402.6, 425.9],
  [425.9, 454.2],
  [454.2, 478.4],
  [478.4, 516.8],
  [516.8, 549.0],
];

const DATE_COLS = [
  [158.3, 176.8],
  [176.8, 197.9],
  [197.9, 218.0],
  [218.0, 253.8],
];

const CLIENT = {
  labelRight: 128.0,
  reportLabelLeft: 360.4,
  reportValueLeft: 402.6,
  phoneLabelLeft: 402.6,
  phoneValueLeft: 454.2,
  right: 549.0,
  row1: [136.0, 168.4],
  row2: [168.4, 190.1],
  row3: [190.1, 200.8],
};

const TECH = {
  left: 63.0,
  labelRight: 128.0,
  modelValueRight: 253.8,
  seriesValueLeft: 328.9,
  mainRight: 328.9,
  callChoiceLeft: 375.2,
  callChoiceRight: 393.2,
  callReasonLeft: 393.2,
  callReasonRight: 444.4,
  callReasonTailRight: 478.4,
  equipLabelLeft: 478.4,
  equipChoiceLeft: 516.8,
  right: 549.0,
  medValueLeft: 444.4,
  medRows: [
    [211.6, 222.4],
    [222.4, 233.2],
    [233.2, 244.0],
  ],
  systemLabelLeft: 425.9,
  systemValueLeft: 478.4,
};

const PARTS = {
  top: 247.1,
  bottom: 466.0,
  headerHeight: 14.0,
  rowHeight: 10.8,
  minRows: 5,
  maxRows: 10,
  leftTable: {
    outerLeft: 63.0,
    empty: [63.0, 94.9],
    shade: [94.9, 110.8],
    num: [110.8, 165.5],
    qty: [165.5, 187.3],
    fte: [187.3, 205.1],
    folio: [205.1, 266.3],
    outerRight: 266.3,
  },
  rightTable: {
    outerLeft: 328.9,
    empty: [328.9, 360.4],
    shade: [360.4, 375.2],
    num: [375.2, 425.9],
    qty: [425.9, 454.2],
    fte: [454.2, 478.4],
    folio: [478.4, 549.0],
    outerRight: 549.0,
  },
  totalRow: [466.0, 483.2],
};

const CHECKLIST = {
  yes: [128.0, 138.6],
  no: [138.6, 151.1],
  solution: [328.9, 549.0],
  rows: [
    [504.8, 526.4],
    [526.4, 548.0],
    [548.0, 569.6],
    [569.6, 591.2],
    [591.2, 612.8],
    [612.8, 634.4],
  ],
  keys: [
    'bandejas_rotas',
    'contacto_electrico',
    'cableado_red',
    'problema_operacion',
    'operador_capacitado',
    'falta_materiales',
  ],
};

const OBSERVATIONS = {
  left: [63.0, 328.9],
  right: [328.9, 549.0],
  box: [645.2, 673.0],  // shortened bottom so signatures start below observations
};

const SIGNATURES = {
  lineY: 713.9,
  left: [70.0, 250.0],
  right: [382.0, 547.0],
  top: 675.0,   // was 660 — now clearly below observations (673), no overlap
  bottom: 705.0, // 30pt signature band, ends before name text and line
};

async function loadTemplateDataUrl() {
  if (typeof window === 'undefined') {
    const { readFile } = await importNodeModule('node:fs/promises');
    const buffer = await readFile(TEMPLATE_NODE_URL);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  const response = await fetch(TEMPLATE_BROWSER_SRC);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeFilePart(value) {
  return normalizeText(value)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Cliente';
}

function isSelected(value, expected) {
  return normalizeText(value).toUpperCase() === normalizeText(expected).toUpperCase();
}

function setValueFont(doc, size = 7.2, weight = 'normal') {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  doc.setTextColor(20, 20, 20);
}

function trimTrailingDots(value) {
  return value.replace(/[.\s]+$/, '');
}

function truncateToWidth(doc, text, width) {
  const clean = normalizeText(text);
  if (!clean) return '';
  if (doc.getTextWidth(clean) <= width) return clean;

  let candidate = clean;
  while (candidate.length > 1) {
    candidate = candidate.slice(0, -1).trimEnd();
    const withEllipsis = `${trimTrailingDots(candidate)}...`;
    if (doc.getTextWidth(withEllipsis) <= width) {
      return withEllipsis;
    }
  }

  return '...';
}

function fitText(doc, {
  text,
  width,
  height,
  maxFontSize = 7.2,
  minFontSize = 4.2,
  lineHeight = 1.08,
  maxLines,
}) {
  const content = normalizeText(text);
  if (!content) {
    return { size: maxFontSize, lines: [] };
  }

  for (let size = maxFontSize; size >= minFontSize; size -= 0.2) {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(content, Math.max(1, width));
    const heightLines = Math.max(1, Math.floor(height / (size * lineHeight)));
    const allowedLines = Math.max(1, Math.min(maxLines ?? heightLines, heightLines));

    if (lines.length <= allowedLines) {
      return { size, lines };
    }
  }

  const size = minFontSize;
  doc.setFontSize(size);
  const heightLines = Math.max(1, Math.floor(height / (size * lineHeight)));
  const allowedLines = Math.max(1, Math.min(maxLines ?? heightLines, heightLines));
  const lines = doc.splitTextToSize(content, Math.max(1, width));
  const visible = lines.slice(0, allowedLines);

  if (lines.length > allowedLines) {
    visible[allowedLines - 1] = truncateToWidth(
      doc,
      `${visible[allowedLines - 1]} ${lines.slice(allowedLines).join(' ')}`,
      width,
    );
  }

  return { size, lines: visible };
}

function drawWrappedText(doc, {
  x,
  y,
  w,
  h,
  text,
  size = 7.2,
  weight = 'normal',
  align = 'left',
  valign = 'middle',
  padding = 3,
  lineHeight = 1.08,
  maxLines,
  minSize,
  baselineFactor = 0.76,
}) {
  const content = normalizeText(text);
  if (!content) return;

  setValueFont(doc, size, weight);
  const usableWidth = Math.max(1, w - padding * 2);
  const usableHeight = Math.max(1, h - padding * 2);
  const fitted = fitText(doc, {
    text: content,
    width: usableWidth,
    height: usableHeight,
    maxFontSize: size,
    minFontSize: minSize ?? Math.min(size, 4.2),
    lineHeight,
    maxLines,
  });

  setValueFont(doc, fitted.size, weight);
  const totalHeight = fitted.lines.length * fitted.size * lineHeight;

  let startY = y + padding + fitted.size;
  if (valign === 'middle') {
    startY = y + Math.max(padding + fitted.size, (h - totalHeight) / 2 + fitted.size * baselineFactor);
  } else if (valign === 'bottom') {
    startY = y + h - padding - totalHeight + fitted.size * baselineFactor;
  }

  fitted.lines.forEach((line, index) => {
    const drawY = startY + index * fitted.size * lineHeight;
    if (align === 'center') {
      doc.text(line, x + w / 2, drawY, { align: 'center' });
      return;
    }
    if (align === 'right') {
      doc.text(line, x + w - padding, drawY, { align: 'right' });
      return;
    }
    doc.text(line, x + padding, drawY);
  });
}

function drawCellValue(doc, x1, y1, x2, y2, text, options = {}) {
  drawWrappedText(doc, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    text,
    ...options,
  });
}

function markCell(doc, x1, y1, x2, y2, active) {
  if (!active) return;
  const padX = Math.max(1.2, Math.min((x2 - x1) * 0.28, 3.2));
  const padY = Math.max(1.2, Math.min((y2 - y1) * 0.24, 3.2));
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(x1 + padX, y1 + padY, x2 - padX, y2 - padY);
  doc.line(x1 + padX, y2 - padY, x2 - padX, y1 + padY);
  doc.setLineWidth(0.7);
}

function strokeRect(doc, x1, y1, x2, y2, style = 'S') {
  doc.rect(x1, y1, x2 - x1, y2 - y1, style);
}

function fillRect(doc, x1, y1, x2, y2, r = 255, g = 255, b = 255) {
  doc.setFillColor(r, g, b);
  doc.rect(x1, y1, x2 - x1, y2 - y1, 'F');
}

function drawLine(doc, x1, y1, x2, y2) {
  doc.line(x1, y1, x2, y2);
}

function drawLabel(doc, x1, y1, x2, y2, text, options = {}) {
  drawCellValue(doc, x1, y1, x2, y2, text, {
    size: options.size ?? 5.8,
    weight: 'bold',
    align: options.align ?? 'center',
    valign: options.valign ?? 'middle',
    padding: options.padding ?? 2,
    lineHeight: options.lineHeight ?? 1.02,
    maxLines: options.maxLines,
    minSize: options.minSize ?? 4.2,
    baselineFactor: options.baselineFactor ?? 0.68,
  });
}

function estimateTextHeight(doc, {
  text,
  width,
  size,
  padding = 2,
  lineHeight = 1.04,
  minHeight = 0,
}) {
  const content = normalizeText(text);
  if (!content) return minHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  const usableWidth = Math.max(1, width - padding * 2);
  const lines = doc.splitTextToSize(content, usableWidth);
  return Math.max(minHeight, lines.length * size * lineHeight + padding * 2);
}

function allocateExtraSpace(baseHeights, preferredHeights, availableHeight) {
  const minTotal = Object.values(baseHeights).reduce((sum, value) => sum + value, 0);
  const extraAvailable = Math.max(0, availableHeight - minTotal);
  const wishes = Object.keys(baseHeights).reduce((acc, key) => {
    acc[key] = Math.max(0, preferredHeights[key] - baseHeights[key]);
    return acc;
  }, {});
  const totalWish = Object.values(wishes).reduce((sum, value) => sum + value, 0);

  if (!totalWish || !extraAvailable) {
    return { ...baseHeights };
  }

  const allocated = { ...baseHeights };
  let consumed = 0;
  const keys = Object.keys(baseHeights);
  keys.forEach((key, index) => {
    const share = index === keys.length - 1
      ? Math.max(0, extraAvailable - consumed)
      : Math.min(wishes[key], extraAvailable * (wishes[key] / totalWish));
    allocated[key] += share;
    consumed += share;
  });

  return allocated;
}

function drawTopInfo(doc, form) {
  const values = [form.numero_tarea, form.reporte_tecnico_no, form.nomina_rt];
  values.forEach((value, index) => {
    const [y1, y2] = TOP_INFO_ROWS[index];
    drawCellValue(doc, TOP_INFO_VALUE.left, y1, TOP_INFO_VALUE.right, y2, value, {
      size: 6.9,
      padding: 2.5,
      maxLines: 1,
      valign: 'middle',
      minSize: 5.6,
      baselineFactor: 0.60,
    });
  });

  const activities = [
    [form.viaje_dia, form.viaje_mes, form.viaje_anio, form.viaje_inicio, form.viaje_fin],
    [form.sr1_dia, form.sr1_mes, form.sr1_anio, form.sr1_inicio, form.sr1_fin],
    [form.sr2_dia, form.sr2_mes, form.sr2_anio, form.sr2_inicio, form.sr2_fin],
    [form.sr3_dia, form.sr3_mes, form.sr3_anio, form.sr3_inicio, form.sr3_fin],
  ];

  activities.forEach((row, rowIndex) => {
    const [y1, y2] = ACTIVITY_ROWS[rowIndex];
    row.forEach((value, colIndex) => {
      const [x1, x2] = ACTIVITY_COLS[colIndex];
      drawCellValue(doc, x1, y1, x2, y2, value, {
        size: 6.2,
        align: 'center',
        padding: 1,
        maxLines: 1,
        minSize: 5.2,
        baselineFactor: 0.60,
      });
    });
  });

  [
    [form.recibida_dia, form.recibida_mes, form.recibida_anio, form.recibida_hora],
    [form.documentada_dia, form.documentada_mes, form.documentada_anio, form.documentada_hora],
  ].forEach((row, rowIndex) => {
    const y1 = rowIndex === 0 ? 99.7 : 110.5;
    const y2 = rowIndex === 0 ? 110.5 : 121.3;
    row.forEach((value, colIndex) => {
      const [x1, x2] = DATE_COLS[colIndex];
      drawCellValue(doc, x1, y1, x2, y2, value, {
        size: 6.2,
        align: 'center',
        padding: 1,
        maxLines: 1,
        minSize: 5.2,
        baselineFactor: 0.60,
      });
    });
  });
}

function drawClientInfo(doc, form) {
  const reporto = [normalizeText(form.reporto_nombre), normalizeText(form.reporto_area)]
    .filter(Boolean)
    .join(' / ');

  drawCellValue(doc, CLIENT.labelRight, CLIENT.row1[0], CLIENT.reportLabelLeft, CLIENT.row1[1], form.razon_social, {
    size: 6.7,
    padding: 3,
    maxLines: 1,
    valign: 'middle',
    minSize: 5.4,
    baselineFactor: 0.72,
  });

  drawCellValue(doc, CLIENT.reportValueLeft, CLIENT.row1[0], CLIENT.right, CLIENT.row1[1], reporto, {
    size: 6.4,
    padding: 3,
    maxLines: 2,
    valign: 'middle',
    minSize: 5.0,
    baselineFactor: 0.72,
  });

  drawCellValue(doc, CLIENT.labelRight, CLIENT.row2[0], CLIENT.phoneLabelLeft, CLIENT.row2[1], form.domicilio, {
    size: 5.8,
    padding: 2.5,
    maxLines: 2,
    valign: 'middle',
    minSize: 4.8,
    baselineFactor: 0.72,
  });

  drawCellValue(doc, CLIENT.phoneValueLeft, CLIENT.row2[0], CLIENT.right, CLIENT.row3[1], form.telefono, {
    size: 5.6,
    padding: 2.5,
    maxLines: 1,
    valign: 'middle',
    minSize: 4.8,
    baselineFactor: 0.72,
  });

  drawCellValue(doc, CLIENT.labelRight, CLIENT.row3[0], CLIENT.phoneLabelLeft, CLIENT.row3[1], form.ciudad_edo, {
    size: 5.6,
    padding: 2.5,
    maxLines: 1,
    valign: 'middle',
    minSize: 4.8,
    baselineFactor: 0.72,
  });
}

function drawTechnicalAndParts(doc, form) {
  const parts = Array.isArray(form.partes)
    ? form.partes.filter((part) => Object.values(part || {}).some((value) => normalizeText(value)))
    : [];
  const printableParts = parts.slice(0, PARTS.maxRows * 2);

  const medidores = [form.medidor_bn, form.medidor_color, form.medidor_total];
  medidores.forEach((value, index) => {
    const [y1, y2] = TECH.medRows[index];
    drawCellValue(doc, TECH.medValueLeft, y1, TECH.right, y2, value, {
      size: 5.8,
      align: 'center',
      padding: 1.5,
      maxLines: 1,
      valign: 'middle',
      minSize: 4.8,
      baselineFactor: 0.72,
    });
  });

  const requiredRows = Math.min(
    PARTS.maxRows,
    Math.max(PARTS.minRows, Math.ceil(Math.max(1, printableParts.length) / 2)),
  );
  const modelHeight = 14.5;

  const baseHeights = {
    problem: 31,
    found: 23,
    description: 34,
  };
  const minimumInfoHeight = Object.values(baseHeights).reduce((sum, value) => sum + value, 0);
  let visibleRows = PARTS.maxRows;
  while (
    visibleRows > requiredRows &&
    (PARTS.bottom - PARTS.top - modelHeight - PARTS.headerHeight - visibleRows * PARTS.rowHeight) < minimumInfoHeight
  ) {
    visibleRows -= 1;
  }

  const infoAvailable = PARTS.bottom - PARTS.top - modelHeight - PARTS.headerHeight - visibleRows * PARTS.rowHeight;
  const preferredHeights = {
    problem: estimateTextHeight(doc, {
      text: form.problema_reportado,
      width: TECH.mainRight - TECH.labelRight,
      size: 5.2,
      padding: 2,
      lineHeight: 1.02,
      minHeight: baseHeights.problem,
    }),
    found: estimateTextHeight(doc, {
      text: form.problema_encontrado,
      width: TECH.mainRight - TECH.labelRight,
      size: 5.0,
      padding: 2,
      lineHeight: 1.02,
      minHeight: baseHeights.found,
    }),
    description: estimateTextHeight(doc, {
      text: form.descripcion_problema_solucion,
      width: TECH.right - TECH.labelRight,
      size: 4.8,
      padding: 1.5,
      lineHeight: 1.0,
      minHeight: baseHeights.description,
    }),
  };

  const heights = allocateExtraSpace(baseHeights, preferredHeights, infoAvailable);
  const descriptionHeight = Math.max(baseHeights.description, infoAvailable - heights.problem - heights.found);

  const yModel1 = PARTS.top;
  const yModel2 = yModel1 + modelHeight;
  const yProblem1 = yModel2;
  const yProblem2 = yProblem1 + heights.problem;
  const yFound1 = yProblem2;
  const yFound2 = yFound1 + heights.found;
  const yDescription1 = yFound2;
  const yDescription2 = yDescription1 + descriptionHeight;
  const yPartsHeader1 = yDescription2;
  const yPartsHeader2 = yPartsHeader1 + PARTS.headerHeight;
  const rowHeight = (PARTS.bottom - yPartsHeader2) / visibleRows;

  fillRect(doc, PARTS.leftTable.outerLeft, PARTS.top, PARTS.rightTable.outerRight, PARTS.bottom);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);

  strokeRect(doc, TECH.left, yModel1, TECH.right, yModel2);
  drawLine(doc, TECH.labelRight, yModel1, TECH.labelRight, yModel2);
  drawLine(doc, TECH.modelValueRight, yModel1, TECH.modelValueRight, yModel2);
  drawLine(doc, TECH.seriesValueLeft, yModel1, TECH.seriesValueLeft, yModel2);
  drawLabel(doc, TECH.left, yModel1, TECH.labelRight, yModel2, 'MODELO', { size: 5.5 });
  drawLabel(doc, TECH.modelValueRight, yModel1, TECH.seriesValueLeft, yModel2, 'SERIE', { size: 5.5 });
  drawCellValue(doc, TECH.labelRight, yModel1, TECH.modelValueRight, yModel2, form.modelo, {
    size: 6.1,
    padding: 3,
    maxLines: 1,
    minSize: 5.0,
    baselineFactor: 0.72,
  });
  drawCellValue(doc, TECH.seriesValueLeft, yModel1, TECH.right, yModel2, form.serie, {
    size: 5.6,
    padding: 2.5,
    maxLines: 1,
    minSize: 4.8,
    baselineFactor: 0.72,
  });

  strokeRect(doc, TECH.left, yProblem1, TECH.right, yProblem2);
  drawLine(doc, TECH.labelRight, yProblem1, TECH.labelRight, yProblem2);
  drawLine(doc, TECH.mainRight, yProblem1, TECH.mainRight, yProblem2);
  drawLine(doc, TECH.callChoiceLeft, yProblem1, TECH.callChoiceLeft, yProblem2);
  drawLine(doc, TECH.callChoiceRight, yProblem1, TECH.callChoiceRight, yProblem2);
  drawLine(doc, TECH.callReasonRight, yProblem1, TECH.callReasonRight, yProblem2);
  drawLine(doc, TECH.callReasonTailRight, yProblem1, TECH.callReasonTailRight, yProblem2);
  drawLine(doc, TECH.equipChoiceLeft, yProblem1, TECH.equipChoiceLeft, yProblem2);

  const problemMid = yProblem1 + (yProblem2 - yProblem1) / 2;
  drawLine(doc, TECH.callChoiceLeft, problemMid, TECH.callChoiceRight, problemMid);
  drawLine(doc, TECH.equipChoiceLeft, problemMid, TECH.right, problemMid);

  const reasonRows = [
    [yProblem1, yProblem1 + (yProblem2 - yProblem1) / 3],
    [yProblem1 + (yProblem2 - yProblem1) / 3, yProblem1 + ((yProblem2 - yProblem1) / 3) * 2],
    [yProblem1 + ((yProblem2 - yProblem1) / 3) * 2, yProblem2],
  ];
  reasonRows.slice(0, 2).forEach(([, rowBottom]) => {
    drawLine(doc, TECH.callReasonLeft, rowBottom, TECH.callReasonTailRight, rowBottom);
  });

  drawLabel(doc, TECH.left, yProblem1, TECH.labelRight, yProblem2, 'PROBLEMA\nREPORTADO', { size: 5.5, maxLines: 2 });
  drawCellValue(doc, TECH.labelRight, yProblem1, TECH.mainRight, yProblem2, form.problema_reportado, {
    size: 5.0,
    padding: 2,
    valign: 'top',
    lineHeight: 1.02,
    minSize: 3.9,
  });
  drawLabel(doc, TECH.mainRight, yProblem1, TECH.callChoiceLeft, yProblem2, 'LLAMADA\nINCOMPLETA', { size: 5.1, maxLines: 2 });
  drawLabel(doc, TECH.callChoiceLeft, yProblem1, TECH.callChoiceRight, problemMid, 'SI', { size: 5.2 });
  drawLabel(doc, TECH.callChoiceLeft, problemMid, TECH.callChoiceRight, yProblem2, 'NO', { size: 5.2 });
  drawLabel(doc, TECH.callReasonLeft, reasonRows[0][0], TECH.callReasonRight, reasonRows[0][1], 'X PARTES', { size: 5.0, minSize: 4.2 });
  drawLabel(doc, TECH.callReasonLeft, reasonRows[1][0], TECH.callReasonRight, reasonRows[1][1], 'X TIEMPO', { size: 5.0, minSize: 4.2 });
  drawLabel(doc, TECH.callReasonLeft, reasonRows[2][0], TECH.callReasonRight, reasonRows[2][1], 'X ASESORIA', { size: 5.0, minSize: 4.2 });
  drawLabel(doc, TECH.equipLabelLeft, yProblem1, TECH.equipChoiceLeft, yProblem2, 'EQUIPO\nFUNCIONA', { size: 5.1, maxLines: 2 });
  drawLabel(doc, TECH.equipChoiceLeft, yProblem1, TECH.right, problemMid, 'SI', { size: 5.2 });
  drawLabel(doc, TECH.equipChoiceLeft, problemMid, TECH.right, yProblem2, 'NO', { size: 5.2 });
  markCell(doc, TECH.callChoiceLeft, yProblem1, TECH.callChoiceRight, problemMid, isSelected(form.llamada_incompleta, 'SI'));
  markCell(doc, TECH.callChoiceLeft, problemMid, TECH.callChoiceRight, yProblem2, isSelected(form.llamada_incompleta, 'NO'));
  markCell(doc, TECH.callReasonRight, reasonRows[0][0], TECH.callReasonTailRight, reasonRows[0][1], isSelected(form.llamada_incompleta_tipo, 'X Partes'));
  markCell(doc, TECH.callReasonRight, reasonRows[1][0], TECH.callReasonTailRight, reasonRows[1][1], isSelected(form.llamada_incompleta_tipo, 'X Tiempo'));
  markCell(doc, TECH.callReasonRight, reasonRows[2][0], TECH.callReasonTailRight, reasonRows[2][1], isSelected(form.llamada_incompleta_tipo, 'X Asesoria'));
  markCell(doc, TECH.equipChoiceLeft, yProblem1, TECH.right, problemMid, isSelected(form.equipo_funciona, 'SI'));
  markCell(doc, TECH.equipChoiceLeft, problemMid, TECH.right, yProblem2, isSelected(form.equipo_funciona, 'NO'));

  strokeRect(doc, TECH.left, yFound1, TECH.right, yFound2);
  drawLine(doc, TECH.labelRight, yFound1, TECH.labelRight, yFound2);
  drawLine(doc, TECH.mainRight, yFound1, TECH.mainRight, yFound2);
  drawLine(doc, TECH.callReasonLeft, yFound1, TECH.callReasonLeft, yFound2);
  drawLine(doc, 425.9, yFound1, 425.9, yFound2);
  drawLine(doc, TECH.systemValueLeft, yFound1, TECH.systemValueLeft, yFound2);
  const foundMid = yFound1 + (yFound2 - yFound1) / 2;
  drawLine(doc, TECH.systemLabelLeft, foundMid, TECH.right, foundMid);
  drawLabel(doc, TECH.left, yFound1, TECH.labelRight, yFound2, 'PROBLEMA\nENCONTRADO', { size: 5.4, maxLines: 2 });
  drawCellValue(doc, TECH.labelRight, yFound1, TECH.mainRight, yFound2, form.problema_encontrado, {
    size: 4.8,
    padding: 2,
    valign: 'top',
    lineHeight: 1.02,
    minSize: 3.9,
  });
  drawLabel(doc, TECH.mainRight, yFound1, TECH.callReasonLeft, yFound2, 'CODIGO DE\nFALLA', { size: 5.0, maxLines: 2 });
  drawCellValue(doc, TECH.callReasonLeft, yFound1, 425.9, yFound2, form.codigo_falla, {
    size: 4.6,
    align: 'center',
    padding: 1.5,
    minSize: 3.8,
    baselineFactor: 0.72,
  });
  drawLabel(doc, TECH.systemLabelLeft, yFound1, TECH.systemValueLeft, foundMid, 'SISTEMA', { size: 4.9 });
  drawLabel(doc, TECH.systemLabelLeft, foundMid, TECH.systemValueLeft, yFound2, 'SUBSISTEMA', { size: 4.9 });
  drawCellValue(doc, TECH.systemValueLeft, yFound1, TECH.right, foundMid, form.sistema, {
    size: 4.5,
    padding: 1.5,
    maxLines: 1,
    minSize: 3.7,
    baselineFactor: 0.72,
  });
  drawCellValue(doc, TECH.systemValueLeft, foundMid, TECH.right, yFound2, form.subsistema, {
    size: 4.5,
    padding: 1.5,
    maxLines: 1,
    minSize: 3.7,
    baselineFactor: 0.72,
  });

  strokeRect(doc, TECH.left, yDescription1, TECH.right, yDescription2);
  drawLine(doc, TECH.labelRight, yDescription1, TECH.labelRight, yDescription2);
  const descGuide1 = yDescription1 + (yDescription2 - yDescription1) / 3;
  const descGuide2 = yDescription1 + ((yDescription2 - yDescription1) / 3) * 2;
  drawLine(doc, TECH.labelRight, descGuide1, TECH.right, descGuide1);
  drawLine(doc, TECH.labelRight, descGuide2, TECH.right, descGuide2);
  drawLabel(doc, TECH.left, yDescription1, TECH.labelRight, yDescription2, 'DESCRIPCION DEL\nPROBLEMA /\nSOLUCION', { size: 5.1, maxLines: 3 });
  drawCellValue(doc, TECH.labelRight, yDescription1, TECH.right, yDescription2, form.descripcion_problema_solucion, {
    size: 4.7,
    padding: 1.5,
    valign: 'top',
    lineHeight: 1.0,
    minSize: 3.8,
  });

  const tables = [PARTS.leftTable, PARTS.rightTable];
  tables.forEach((table) => {
    strokeRect(doc, table.outerLeft, yPartsHeader1, table.outerRight, yPartsHeader2);
    drawLine(doc, table.empty[1], yPartsHeader1, table.empty[1], PARTS.bottom);
    drawLine(doc, table.shade[1], yPartsHeader1, table.shade[1], PARTS.bottom);
    drawLine(doc, table.num[1], yPartsHeader1, table.num[1], PARTS.bottom);
    drawLine(doc, table.qty[1], yPartsHeader1, table.qty[1], PARTS.bottom);
    drawLine(doc, table.fte[1], yPartsHeader1, table.fte[1], PARTS.bottom);
    fillRect(doc, table.shade[0], yPartsHeader2, table.shade[1], PARTS.bottom, 216, 216, 216);
    drawLabel(doc, table.empty[0], yPartsHeader1, table.num[1], yPartsHeader2, 'NUM. DE PARTE', { size: 5.7 });
    drawLabel(doc, table.num[1], yPartsHeader1, table.qty[1], yPartsHeader2, 'CANT', { size: 5.3 });
    drawLabel(doc, table.qty[1], yPartsHeader1, table.fte[1], yPartsHeader2, 'FTE.', { size: 5.1 });
    drawLabel(doc, table.fte[1], yPartsHeader1, table.folio[1], yPartsHeader2, 'FOLIO', { size: 5.7 });

    for (let rowIndex = 0; rowIndex < visibleRows; rowIndex += 1) {
      const rowTop = yPartsHeader2 + rowIndex * rowHeight;
      const rowBottom = rowTop + rowHeight;
      strokeRect(doc, table.outerLeft, rowTop, table.outerRight, rowBottom);
    }
  });

  printableParts.slice(0, visibleRows * 2).forEach((part, index) => {
    const table = index < visibleRows ? PARTS.leftTable : PARTS.rightTable;
    const rowIndex = index < visibleRows ? index : index - visibleRows;
    if (rowIndex >= visibleRows) return;
    const y1 = yPartsHeader2 + rowIndex * rowHeight;
    const y2 = y1 + rowHeight;

    drawCellValue(doc, table.num[0], y1, table.num[1], y2, part.num_parte, {
      size: 5.8,
      padding: 2,
      maxLines: 1,
      minSize: 4.8,
      baselineFactor: 0.72,
    });
    drawCellValue(doc, table.qty[0], y1, table.qty[1], y2, part.cant, {
      size: 5.8,
      align: 'center',
      padding: 1,
      maxLines: 1,
      minSize: 4.8,
      baselineFactor: 0.72,
    });
    drawCellValue(doc, table.fte[0], y1, table.fte[1], y2, part.fte, {
      size: 5.6,
      align: 'center',
      padding: 1,
      maxLines: 1,
      minSize: 4.8,
      baselineFactor: 0.72,
    });
    drawCellValue(doc, table.folio[0], y1, table.folio[1], y2, part.folio, {
      size: 5.8,
      padding: 2,
      maxLines: 1,
      minSize: 4.8,
      baselineFactor: 0.72,
    });
  });

  drawCellValue(doc, 266.3, PARTS.totalRow[0], 328.9, PARTS.totalRow[1], String(parts.length), {
    size: 7.0,
    align: 'center',
    padding: 1,
    maxLines: 1,
    minSize: 5.8,
    baselineFactor: 0.72,
  });
}

function drawChecklist(doc, form) {
  const checklist = form.checklist || {};

  CHECKLIST.keys.forEach((key, index) => {
    const entry = checklist[key] || {};
    const [y1, y2] = CHECKLIST.rows[index];

    markCell(doc, CHECKLIST.yes[0], y1, CHECKLIST.yes[1], y2, isSelected(entry.valor, 'SI'));
    markCell(doc, CHECKLIST.no[0], y1, CHECKLIST.no[1], y2, isSelected(entry.valor, 'NO'));

    drawCellValue(doc, CHECKLIST.solution[0], y1, CHECKLIST.solution[1], y2, entry.comentario, {
      size: 6.0,
      padding: 4,
      maxLines: 2,
      valign: 'middle',
      minSize: 4.8,
      baselineFactor: 0.72,
    });
  });
}

function drawObservations(doc, form) {
  const [obsTop, obsBottom] = OBSERVATIONS.box;

  drawCellValue(doc, OBSERVATIONS.left[0], obsTop, OBSERVATIONS.left[1], obsBottom, form.obs_cliente, {
    size: 6.1,
    padding: 4,
    valign: 'top',
    lineHeight: 1.0,
    minSize: 4.8,
  });

  drawCellValue(doc, OBSERVATIONS.right[0], obsTop, OBSERVATIONS.right[1], obsBottom, form.obs_ids, {
    size: 6.1,
    padding: 4,
    valign: 'top',
    lineHeight: 1.0,
    minSize: 4.8,
  });

  // Maintain the native canvas aspect ratio (640×190 px = 3.368:1) and center
  // the signature image horizontally within each column's allocated space.
  const sigNativeAspect = 640 / 190;
  const signatureHeight = SIGNATURES.bottom - SIGNATURES.top;
  const maxWidthLeft  = SIGNATURES.left[1]  - SIGNATURES.left[0]  - 24;
  const maxWidthRight = SIGNATURES.right[1] - SIGNATURES.right[0] - 24;
  const signatureWidthLeft  = Math.min(maxWidthLeft,  signatureHeight * sigNativeAspect);
  const signatureWidthRight = Math.min(maxWidthRight, signatureHeight * sigNativeAspect);
  const sigXLeft  = SIGNATURES.left[0]  + 12 + (maxWidthLeft  - signatureWidthLeft)  / 2;
  const sigXRight = SIGNATURES.right[0] + 12 + (maxWidthRight - signatureWidthRight) / 2;

  if (form.firma_cliente_data_url) {
    try {
      doc.addImage(
        form.firma_cliente_data_url,
        'PNG',
        sigXLeft,
        SIGNATURES.top,
        signatureWidthLeft,
        signatureHeight,
      );
    } catch {
      // Ignore malformed signatures and keep the rest of the PDF intact.
    }
  }

  if (form.firma_ingeniero_data_url) {
    try {
      doc.addImage(
        form.firma_ingeniero_data_url,
        'PNG',
        sigXRight,
        SIGNATURES.top,
        signatureWidthRight,
        signatureHeight,
      );
    } catch {
      // Ignore malformed signatures and keep the rest of the PDF intact.
    }
  }

  // Printed name sits in the narrow band between the signature image and the line.
  drawCellValue(doc, SIGNATURES.left[0], SIGNATURES.bottom, SIGNATURES.left[1], SIGNATURES.lineY, form.firma_cliente, {
    size: 6.8,
    align: 'center',
    padding: 1,
    maxLines: 1,
    valign: 'bottom',
    minSize: 4.8,
    baselineFactor: 0.72,
  });

  drawCellValue(doc, SIGNATURES.right[0], SIGNATURES.bottom, SIGNATURES.right[1], SIGNATURES.lineY, form.firma_ingeniero, {
    size: 6.8,
    align: 'center',
    padding: 1,
    maxLines: 1,
    valign: 'bottom',
    minSize: 4.8,
    baselineFactor: 0.72,
  });
}

function getReportFilename(form) {
  const reportNumber = sanitizeFilePart(form.reporte_tecnico_no || 'RT');
  const clientName = sanitizeFilePart(form.razon_social);
  return `Reporte_${reportNumber}_${clientName}.pdf`;
}

async function buildReportDoc(form) {
  const doc = new jsPDF({
    format: 'letter',
    unit: 'pt',
    orientation: 'portrait',
  });

  const templateDataUrl = await loadTemplateDataUrl();
  doc.addImage(templateDataUrl, 'PNG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  drawTopInfo(doc, form);
  drawClientInfo(doc, form);
  drawTechnicalAndParts(doc, form);
  drawChecklist(doc, form);
  drawObservations(doc, form);

  return doc;
}

export async function generarPDF(form, options = {}) {
  const doc = await buildReportDoc(form);
  const filename = options.filename || getReportFilename(form);

  if (typeof window === 'undefined' && options.outputPath) {
    const { writeFile } = await importNodeModule('node:fs/promises');
    const arrayBuffer = doc.output('arraybuffer');
    await writeFile(options.outputPath, new Uint8Array(arrayBuffer));
    return options.outputPath;
  }

  doc.save(filename);
  return filename;
}
