import { describe, it, expect } from 'vitest';
import {
  computeMeterTotal,
  isPartEmpty,
  resolveFteDisplay,
  createReportId,
  getNowParts,
} from '../../shared/reportUtils.js';

describe('computeMeterTotal', () => {
  it('adds bn + color', () => {
    expect(computeMeterTotal('100', '50')).toBe('150');
  });

  it('returns empty string when both inputs are empty', () => {
    expect(computeMeterTotal('', '')).toBe('');
  });

  it('returns empty string when both inputs are undefined', () => {
    expect(computeMeterTotal(undefined, undefined)).toBe('');
  });

  it('returns bn alone when color is empty', () => {
    expect(computeMeterTotal('148320', '')).toBe('148320');
  });

  it('returns color alone when bn is empty', () => {
    expect(computeMeterTotal('', '54870')).toBe('54870');
  });

  it('handles decimal values', () => {
    expect(computeMeterTotal('10.5', '0.5')).toBe('11');
  });

  it('strips commas and non-numeric characters before parsing', () => {
    expect(computeMeterTotal('1,000', '500')).toBe('1500');
  });

  it('handles zero values explicitly entered', () => {
    expect(computeMeterTotal('0', '0')).toBe('0');
  });

  it('handles large realistic meter counts', () => {
    expect(computeMeterTotal('148320', '54870')).toBe('203190');
  });

  it('treats whitespace-only as empty', () => {
    expect(computeMeterTotal('   ', '   ')).toBe('');
  });
});

describe('isPartEmpty', () => {
  it('returns true for an empty object', () => {
    expect(isPartEmpty({})).toBe(true);
  });

  it('returns true when all fields are empty strings', () => {
    expect(isPartEmpty({ numParte: '', cantidad: '', fteCode: '', folio: '' })).toBe(true);
  });

  it('returns false when numParte has a value', () => {
    expect(isPartEmpty({ numParte: '059K65820' })).toBe(false);
  });

  it('returns false when fteCode has a value', () => {
    expect(isPartEmpty({ fteCode: '06' })).toBe(false);
  });

  it('returns false when fteOtherText has a value', () => {
    expect(isPartEmpty({ fteOtherText: 'LOC' })).toBe(false);
  });

  it('returns false when any single field is non-empty', () => {
    expect(isPartEmpty({ numParte: '', cantidad: '', fteCode: '', folio: 'F-001' })).toBe(false);
  });

  it('returns true for undefined input', () => {
    expect(isPartEmpty(undefined)).toBe(true);
  });
});

describe('resolveFteDisplay', () => {
  it('returns fteDisplay if already set', () => {
    expect(resolveFteDisplay({ fteDisplay: 'PREV', fteCode: 'OTRO', fteOtherText: 'LOC' })).toBe('PREV');
  });

  it('returns fteOtherText when fteCode is OTRO', () => {
    expect(resolveFteDisplay({ fteCode: 'OTRO', fteOtherText: 'LOC' })).toBe('LOC');
  });

  it('returns fteCode for a regular code', () => {
    expect(resolveFteDisplay({ fteCode: '06' })).toBe('06');
  });

  it('returns empty string for an empty part', () => {
    expect(resolveFteDisplay({})).toBe('');
  });

  it('trims whitespace from fteCode', () => {
    expect(resolveFteDisplay({ fteCode: '  02  ' })).toBe('02');
  });
});

describe('createReportId', () => {
  it('matches the RT-YYYYMMDD-XXXXX format', () => {
    const id = createReportId();
    expect(id).toMatch(/^RT-\d{8}-[A-Z0-9]{5}$/);
  });

  it('uses the provided date', () => {
    // Use local date constructor to avoid UTC off-by-one across timezones
    const id = createReportId(new Date(2026, 3, 8)); // April 8, 2026 local time
    expect(id).toMatch(/^RT-20260408-[A-Z0-9]{5}$/);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 10 }, () => createReportId()));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('getNowParts', () => {
  it('returns an object with string fields dia, mes, anio, hora', () => {
    const parts = getNowParts();
    expect(typeof parts.dia).toBe('string');
    expect(typeof parts.mes).toBe('string');
    expect(typeof parts.anio).toBe('string');
    expect(typeof parts.hora).toBe('string');
  });

  it('returns correct values for a known date', () => {
    const parts = getNowParts(new Date('2026-06-28T09:30:00'));
    expect(parts.dia).toBe('28');
    expect(parts.mes).toBe('6');
    expect(parts.anio).toBe('2026');
    expect(parts.hora).toBe('09:30');
  });

  it('zero-pads hours and minutes', () => {
    const parts = getNowParts(new Date('2026-01-05T08:05:00'));
    expect(parts.hora).toBe('08:05');
  });
});
