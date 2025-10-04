import { Schema, model } from 'mongoose';

const WorkingHourSchema = new Schema(
  {
    day: { type: Number, required: true },          // 0=Pon ... 6=Nd (albo odwrotnie – ważne by konsekwentnie)
    open: { type: Boolean, default: false },
    start: { type: String, default: '09:00' },      // HH:mm
    end: { type: String, default: '17:00' },        // HH:mm
    breakStart: { type: String, default: '' },      // HH:mm (opcjonalnie)
    breakEnd: { type: String, default: '' }         // HH:mm (opcjonalnie)
  },
  { _id: false }
);

const VetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    clinicName: { type: String, required: true },
    licenseNo: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String },

    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'Polska' }
    },

    about: { type: String, default: '' },

    acceptsNewPatients: { type: Boolean, default: true },
    acceptsEmergency:   { type: Boolean, default: false },
    emergencyPhone:     { type: String, default: '' },

    specialties:     { type: [String], default: [] },    // np. „Dermatologia”, „Chirurgia”
    servicesOffered: { type: [String], default: [] },    // np. „Szczepienia”, „USG”
    languages:       { type: [String], default: [] },    // np. „polski”, „angielski”
    paymentMethods:  { type: [String], default: [] },    // np. „gotówka”, „karta”, „BLIK”

    appointmentDurationMin: { type: Number, default: 20 }, // minuty
    consultPrice:           { type: Number, default: 0 },  // PLN

    workingHours: { type: [WorkingHourSchema], default: [] }
  },
  { timestamps: true }
);
VetSchema.virtual('vetName').get(function (this: any) {
  const u = this.userId; // po populate może być obiektem
  if (!u) return undefined;
  // popularne warianty pól w User:
  const name = u.name || u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || undefined;
});

// ⬇️ włącz virtuale w JSON i obiekcie
VetSchema.set('toJSON', { virtuals: true });
VetSchema.set('toObject', { virtuals: true });

export default model('Vet', VetSchema);
