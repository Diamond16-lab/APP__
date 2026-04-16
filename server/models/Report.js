import mongoose from 'mongoose';

const datePartsSchema = new mongoose.Schema(
  {
    dia: { type: String, default: '' },
    mes: { type: String, default: '' },
    anio: { type: String, default: '' },
    hora: { type: String, default: '' },
    inicio: { type: String, default: '' },
    fin: { type: String, default: '' },
  },
  { _id: false },
);

const partSchema = new mongoose.Schema(
  {
    numParte: { type: String, default: '' },
    cantidad: { type: String, default: '' },
    fteCode: { type: String, default: '' },
    fteOtherText: { type: String, default: '' },
    fteDisplay: { type: String, default: '' },
    folio: { type: String, default: '' },
  },
  { _id: false },
);

const checklistItemSchema = new mongoose.Schema(
  {
    valor: { type: String, default: '' },
    comentario: { type: String, default: '' },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    taskNumber: { type: String, required: true, trim: true },
    reportTechnicalNo: { type: String, required: true, trim: true, unique: true },
    employeeNumber: { type: String, required: true, trim: true },
    reportDate: { type: Date, required: true, index: true },
    received: { type: datePartsSchema, default: () => ({}) },
    documented: { type: datePartsSchema, default: () => ({}) },
    activities: {
      viaje: { type: datePartsSchema, default: () => ({}) },
      sr1: { type: datePartsSchema, default: () => ({}) },
      sr2: { type: datePartsSchema, default: () => ({}) },
      sr3: { type: datePartsSchema, default: () => ({}) },
    },
    client: {
      businessName: { type: String, required: true, trim: true, index: true },
      reportedByName: { type: String, required: true, trim: true },
      reportedByArea: { type: String, default: '', trim: true },
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      cityState: { type: String, required: true, trim: true },
    },
    equipment: {
      model: { type: String, required: true, trim: true },
      serial: { type: String, required: true, trim: true, index: true },
      system: { type: String, default: '', trim: true },
      subsystem: { type: String, default: '', trim: true },
    },
    meters: {
      bn: { type: String, default: '' },
      color: { type: String, default: '' },
      total: { type: String, default: '' },
    },
    technical: {
      problemReported: { type: String, required: true, trim: true },
      incompleteCall: { type: String, required: true, trim: true },
      incompleteCallReason: { type: String, default: '', trim: true },
      equipmentWorks: { type: String, required: true, trim: true },
      problemFound: { type: String, default: '', trim: true },
      faultCode: { type: String, default: '', trim: true },
      descriptionSolution: { type: String, required: true, trim: true },
    },
    parts: {
      type: [partSchema],
      default: [],
    },
    checklist: {
      bandejas_rotas: { type: checklistItemSchema, default: () => ({}) },
      contacto_electrico: { type: checklistItemSchema, default: () => ({}) },
      cableado_red: { type: checklistItemSchema, default: () => ({}) },
      problema_operacion: { type: checklistItemSchema, default: () => ({}) },
      operador_capacitado: { type: checklistItemSchema, default: () => ({}) },
      falta_materiales: { type: checklistItemSchema, default: () => ({}) },
    },
    observations: {
      client: { type: String, default: '', trim: true },
      ids: { type: String, default: '', trim: true },
    },
    signatures: {
      clientName: { type: String, required: true, trim: true },
      clientDataUrl: { type: String, required: true },
      engineerName: { type: String, required: true, trim: true },
      engineerDataUrl: { type: String, required: true },
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    technicianName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    generatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      fullName: { type: String, required: true, trim: true },
      username: { type: String, default: '', trim: true },
      employeeNumber: { type: String, default: '', trim: true },
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index({ 'equipment.serial': 1, reportDate: 1 });

export const Report = mongoose.model('Report', reportSchema);
