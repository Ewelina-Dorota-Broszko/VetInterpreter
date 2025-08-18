import { Schema, model, Types } from 'mongoose';

/** ===== Subschemas ===== */

// Blood test
const BloodTestSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    hemoglobin: Number, rbc: Number, wbc: Number, hematocrit: Number,
    platelets: Number, mcv: Number, mch: Number, mchc: Number,
    glucose: Number, urea: Number, creatinine: Number,
    alt: Number, ast: Number, alp: Number,
    totalProtein: Number, albumin: Number, globulin: Number,
    bilirubinTotal: Number, bilirubinDirect: Number, bilirubinIndirect: Number,
    comments: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Urine test
const UrineTestSchema = new Schema(
  {
    date: { type: String, required: true },   // YYYY-MM-DD
    // sekcja: fizykochemia
    color: { type: String, required: true },
    clarity: { type: String },                // przejrzystość
    specificGravity: { type: Number, required: true },
    pH: { type: Number, required: true },
    protein: { type: String, required: true },
    glucose: { type: String, required: true },
    ketones: { type: String, required: true },
    bilirubin: { type: String },
    urobilinogen: { type: String },
    blood: { type: String },
    nitrites: { type: String },
    leukocyteEsterase: { type: String },

    // sekcja: mikroskopia
    wbc: { type: String },             // leukocyty / pole widzenia
    rbc: { type: String },             // erytrocyty / pole widzenia
    epithelialCells: { type: String },
    crystals: { type: String },
    casts: { type: String },
    bacteria: { type: String },
    yeast: { type: String },
    sperm: { type: String },
    mucus: { type: String },
    parasites: { type: String },

    // inne
    comments: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Stool test
const StoolTestSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    consistency: { type: String, enum: ['solid', 'soft', 'watery'], required: true },
    color: { type: String, required: true },
    blood: { type: Boolean, required: true },
    mucus: { type: Boolean, required: true },

    // nowe pola z formularza:
    odor: { type: String, default: '' },       // opis zapachu
    parasites: { type: Boolean, default: false },
    comments: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Temperature log
const TemperatureLogSchema = new Schema(
  {
    date: { type: String, required: true },   // YYYY-MM-DD
    time: { type: String, required: true },   // HH:mm
    temperature: { type: Number, required: true },

    // nowe pola z formularza
    behavior: {
      type: String,
      enum: ['normal', 'lethargic', 'agitated', 'unresponsive', ''],
      default: ''
    },
    appetite: {
      type: String,
      enum: ['normal', 'reduced', 'none', ''],
      default: ''
    },
    comments: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Diabetes log
const DiabetesLogSchema = new Schema(
  {
    date: { type: String, required: true },   // YYYY-MM-DD
    time: { type: String, required: true },   // HH:mm
    glucose: { type: Number, required: true }, // mg/dL

    measurementType: { 
      type: String, 
      enum: ['fasting', 'postMeal', 'random'], 
      required: true 
    },

    insulinType: { type: String, default: '' },  // np. „Lantus”, „NovoRapid”
    insulinDose: { type: Number, default: null },

    comments: { type: String, default: '' }      // dodatkowe uwagi
  },
  { _id: true, timestamps: true }
);

// Weight & BCS
const WeightEntrySchema = new Schema(
  {
    date: { type: String, required: true },
    weightKg: { type: Number, required: true },
    bcs: { type: Number },
    note: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Vaccination
const VaccinationSchema = new Schema(
  {
    type: { type: String, required: true },
    date: { type: String, required: true },
    dueDate: { type: String },
    product: { type: String },
    batch: { type: String },
    vet: { type: String },
    notes: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Medication plan
const MedicationPlanSchema = new Schema(
  {
    name: { type: String, required: true },
    dose: { type: String, required: true },
    frequency: { type: String, required: true },
    timesOfDay: { type: [String], default: [] },
    startDate: { type: String, required: true },
    endDate: { type: String },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Symptoms
const SymptomEntrySchema = new Schema(
  {
    date: { type: String, required: true },
    symptomTags: { type: [String], default: [] },
    painScore: { type: Number },
    energy: { type: Number },
    appetite: { type: Number },
    notes: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Visit + medications
const VisitMedicationSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    timesOfDay: { type: [String], default: [] }
  },
  { _id: true }
);

const VisitRecordSchema = new Schema(
  {
    visitDate: { type: String, required: true },
    clinicName: { type: String, required: true },
    vetName: { type: String, required: true },
    nextVisitDate: { type: String },
    symptoms: { type: String },
    treatments: { type: String },
    medications: { type: [VisitMedicationSchema], default: [] },
    notes: { type: String, default: '' },
    expanded: { type: Boolean, default: false }
  },
  { _id: true, timestamps: true }
);

// Calendar event
const CalendarEventSchema = new Schema(
  {
    id: { type: String, required: true },  // np. UUID z frontu
    date: { type: String, required: true },
    time: { type: String },
    title: { type: String, required: true },
    notes: { type: String, default: '' }
  },
  { _id: true, timestamps: true }
);

// Diet
const DietSchema = new Schema(
  {
    currentPlan: {
      name: String,
      startedAt: String,
      caloriesPerDay: Number,
      notes: String
    },
    history: [
      { name: String, from: String, to: String, notes: String }
    ]
  },
  { _id: false }
);

/** ===== Animal main ===== */
const AnimalSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: 'Owner', required: true, index: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: ['dog', 'cat'], required: true },
    breed: { type: String, default: '' },
    sex: { type: String, enum: ['male', 'female'], required: true },
    weightKg: { type: Number, default: 0 },
    birthDate: { type: String, required: true },

    bloodTests: { type: [BloodTestSchema], default: [] },
    urineTests: { type: [UrineTestSchema], default: [] },
    stoolTests: { type: [StoolTestSchema], default: [] },
    temperatureLogs: { type: [TemperatureLogSchema], default: [] },
    diabetesLogs: { type: [DiabetesLogSchema], default: [] },

    weightHistory: { type: [WeightEntrySchema], default: [] },
    vaccinations: { type: [VaccinationSchema], default: [] },
    medications: { type: [MedicationPlanSchema], default: [] },
    symptoms: { type: [SymptomEntrySchema], default: [] },
    visitHistory: { type: [VisitRecordSchema], default: [] },

    calendar: { type: [CalendarEventSchema], default: [] },
    diet: { type: DietSchema, default: {} }
  },
  { timestamps: true }
);

// indeksy
AnimalSchema.index({ 'bloodTests.date': 1 });
AnimalSchema.index({ 'urineTests.date': 1 });
AnimalSchema.index({ 'stoolTests.date': 1 });
AnimalSchema.index({ 'temperatureLogs.date': 1 });
AnimalSchema.index({ 'diabetesLogs.date': 1 });
AnimalSchema.index({ 'weightHistory.date': 1 });
AnimalSchema.index({ 'vaccinations.date': 1, 'vaccinations.dueDate': 1 });
AnimalSchema.index({ 'symptoms.date': 1 });
AnimalSchema.index({ 'visitHistory.visitDate': 1 });
AnimalSchema.index({ 'calendar.date': 1 });

export const Animal = model('Animal', AnimalSchema);
export default Animal;
