export const SYSTEM_OPTIONS = [
  'Alimentacion',
  'Impresion',
  'Escaneo',
  'Red',
  'Software',
  'Seguridad',
  'Energia',
  'Fusor',
  'Imagen',
  'Acabados',
  'Alimentador',
  'Consumibles',
  'Otro',
];

export const SUBSYSTEM_OPTIONS = [
  'Bandeja 1',
  'Bandeja 2',
  'Bandeja 3',
  'Bandeja 4',
  'Bypass',
  'ADF',
  'Rodillos',
  'Registro',
  'Duplex',
  'Modulo color',
  'Unidad de imagen',
  'Fusor',
  'Tarjeta de red',
  'Wi-Fi',
  'Panel tactil',
  'Firmware',
  'Fuente de poder',
  'Ventilacion interna',
  'Otro',
];

export const FTE_OPTIONS = [
  { value: '06', label: '06' },
  { value: '02', label: '02' },
  { value: 'OTRO', label: 'Otro' },
];

export function getReportCatalogs() {
  return {
    systems: SYSTEM_OPTIONS,
    subsystems: SUBSYSTEM_OPTIONS,
    fteOptions: FTE_OPTIONS,
  };
}
