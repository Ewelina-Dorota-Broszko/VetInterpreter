import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Chart from 'chart.js/auto';

// Typy
type Sex = 'male' | 'female';

interface BloodTest {
  date: string;
  hemoglobin: number;
  rbc: number;
  wbc: number;
  hematocrit: number;
  platelets: number;
  mcv: number;
  mch: number;
  mchc: number;
  glucose: number;
  urea: number;
  creatinine: number;
  alt: number;
  ast: number;
  alp: number;
  totalProtein: number;
  albumin: number;
  globulin: number;
  bilirubinTotal: number;
  bilirubinDirect: number;
  bilirubinIndirect: number;
  comments?: string;
}

interface UrineTest {
  date: string;
  color: string;
  specificGravity: number;
  pH: number;
  protein: string;
  glucose: string;
  ketones: string;
}

interface StoolTest {
  date: string;
  consistency: 'solid' | 'soft' | 'watery';
  color: string;
  blood: boolean;
  mucus: boolean;
}

interface TemperatureLog {
  date: string;
  time: string;
  temperature: number;
}

interface DiabetesLog {
  date: string;
  time: string;
  glucose: number;
  measurementType: 'fasting' | 'postMeal' | 'random';
  insulinType?: string;
  insulinDose?: number;
}

interface VisitMedication {
  name: string;
  dosage: string;
  frequency: string;
}

interface VisitRecord {
  visitDate: string;
  clinicName: string;
  vetName: string;
  nextVisitDate?: string;
  symptoms?: string;
  treatments?: string;
  medications?: VisitMedication[];
  notes?: string;
  expanded?: boolean;
}

/** Waga & BCS */
interface WeightEntry {
  date: string;
  weightKg: number;
  bcs?: number;
  note?: string;
}

/** SZCZEPIENIA (2) */
interface Vaccination {
  type: string;
  date: string;
  dueDate?: string;
  product?: string;
  batch?: string;
  vet?: string;
  notes?: string;
}

/** LEKI (3) */
interface MedicationPlan {
  name: string;
  dose: string;          // np. "5 mg"
  frequency: string;     // np. "2x dziennie"
  timesOfDay?: string[]; // ["08:00","20:00"]
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

/** OBJAWY (6) */
interface SymptomEntry {
  date: string;
  symptomTags: string[];
  painScore?: number; // 0-10
  energy?: number;    // 1-5
  appetite?: number;  // 1-5
  notes?: string;
}

interface Animal {
  id: number;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: Sex;
  weightKg: number;
  birthDate: string;
  ownerName: string;
  bloodTests: BloodTest[];
  urineTests: UrineTest[];
  stoolTests: StoolTest[];
  temperatureLogs: TemperatureLog[];
  diabetesLogs: DiabetesLog[];
  visitHistory?: VisitRecord[];

  // Nowe pola
  weightHistory?: WeightEntry[];
  vaccinations?: Vaccination[];
  medications?: MedicationPlan[];
  symptoms?: SymptomEntry[];
}

@Component({
  selector: 'app-animal-profile',
  templateUrl: './animal-profile.component.html',
  styleUrls: ['./animal-profile.component.scss']
})
export class AnimalProfileComponent {
  animalId!: number;
  animal!: Animal;

  activeTab:
    | 'overview'
    | 'blood'
    | 'urine'
    | 'stool'
    | 'temperature'
    | 'diabetes'
    | 'weight'
    | 'vaccinations'
    | 'meds'
    | 'symptoms' = 'overview';

  // Formularze
  weightForm: Partial<WeightEntry> = {};
  vaxForm: Partial<Vaccination> = {};
  medForm: any = { isActive: true };
  symForm: any = {};

  private chartInstance: Chart | null = null;
  private chartTempInstance: Chart | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.params.subscribe(p => {
      this.animalId = +p['id'];
      this.loadAnimal();
    });
  }

  referenceRanges = {
    // Morfologia
    hemoglobin: { min: 12, max: 18, unit: 'g/dL' },
    rbc: { min: 5.0, max: 8.5, unit: '10¹²/L' },
    wbc: { min: 6.0, max: 17.0, unit: '10⁹/L' },
    hematocrit: { min: 37, max: 55, unit: '%' },
    platelets: { min: 200, max: 500, unit: '10⁹/L' },
    mcv: { min: 80, max: 100, unit: 'fL' },
    mch: { min: 27, max: 33, unit: 'pg' },
    mchc: { min: 31, max: 36, unit: 'g/dL' },

    // Biochemia
    glucose: { min: 70, max: 140, unit: 'mg/dL' },
    urea: { min: 20, max: 55, unit: 'mg/dL' },
    creatinine: { min: 0.5, max: 1.5, unit: 'mg/dL' },
    alt: { min: 10, max: 100, unit: 'U/L' },
    ast: { min: 10, max: 100, unit: 'U/L' },
    alp: { min: 20, max: 150, unit: 'U/L' },
    totalProtein: { min: 5.5, max: 7.5, unit: 'g/dL' },
    albumin: { min: 2.5, max: 4.0, unit: 'g/dL' },
    globulin: { min: 2.5, max: 4.0, unit: 'g/dL' },

    // Bilirubina
    bilirubinTotal: { min: 0.1, max: 1.2, unit: 'mg/dL' },
    bilirubinDirect: { min: 0.0, max: 0.3, unit: 'mg/dL' },
    bilirubinIndirect: { min: 0.1, max: 1.0, unit: 'mg/dL' },
  };

  getRangeText(param: keyof typeof this.referenceRanges): string {
    const range = this.referenceRanges[param];
    return `(${range.min}–${range.max} ${range.unit})`;
  }

  getValueStatus(value: number, param: keyof typeof this.referenceRanges): 'low' | 'normal' | 'high' {
    const range = this.referenceRanges[param];
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
  }

  private mockAnimals: Animal[] = [
    {
      id: 1,
      name: 'Rex',
      species: 'dog',
      breed: 'Labrador Retriever',
      sex: 'male',
      weightKg: 32.5,
      birthDate: '2018-05-12',
      ownerName: 'John Doe',
      bloodTests: [
        {
          date: '2025-07-20',
          hemoglobin: 14.1,
          rbc: 6.2,
          wbc: 9.8,
          hematocrit: 42,
          platelets: 300,
          mcv: 88,
          mch: 29,
          mchc: 33,
          glucose: 95,
          urea: 32,
          creatinine: 1.2,
          alt: 35,
          ast: 28,
          alp: 92,
          totalProtein: 6.8,
          albumin: 3.9,
          globulin: 2.9,
          bilirubinTotal: 0.8,
          bilirubinDirect: 0.3,
          bilirubinIndirect: 0.5,
          comments: 'Normal test'
        },
        {
          date: '2025-06-15',
          hemoglobin: 11.5, rbc: 4.8, wbc: 6.5, hematocrit: 35, platelets: 190,
          mcv: 76, mch: 25, mchc: 30, glucose: 130, urea: 60, creatinine: 1.6,
          alt: 115, ast: 95, alp: 160, totalProtein: 5.3, albumin: 2.3, globulin: 2.8,
          bilirubinTotal: 1.3, bilirubinDirect: 0.35, bilirubinIndirect: 1.0,
          comments: 'Anemia suspected'
        },
        {
          date: '2025-05-10',
          hemoglobin: 15.5, rbc: 7.0, wbc: 16.5, hematocrit: 50, platelets: 420,
          mcv: 90, mch: 30, mchc: 34, glucose: 80, urea: 45, creatinine: 1.0,
          alt: 40, ast: 35, alp: 110, totalProtein: 7.0, albumin: 3.8, globulin: 3.2,
          bilirubinTotal: 1.0, bilirubinDirect: 0.2, bilirubinIndirect: 0.8,
          comments: 'Slightly elevated WBC'
        },
        {
          date: '2025-04-02',
          hemoglobin: 17.9, rbc: 8.4, wbc: 16.9, hematocrit: 54, platelets: 499,
          mcv: 99, mch: 32.5, mchc: 35.5, glucose: 139, urea: 50, creatinine: 1.3,
          alt: 75, ast: 82, alp: 100, totalProtein: 7.4, albumin: 4.0, globulin: 3.4,
          bilirubinTotal: 1.1, bilirubinDirect: 0.3, bilirubinIndirect: 0.8,
          comments: 'Values near upper range'
        }
      ],
      urineTests: [
        { date: '2025-07-18', color: 'yellow', specificGravity: 1.030, pH: 6.0, protein: 'trace', glucose: 'negative', ketones: 'negative' }
      ],
      stoolTests: [
        { date: '2025-07-10', consistency: 'soft', color: 'brown', blood: false, mucus: true }
      ],
      temperatureLogs: [
        { date: '2025-07-26', time: '08:00', temperature: 38.5 },
        { date: '2025-07-25', time: '20:00', temperature: 38.8 },
        { date: '2025-07-24', time: '18:00', temperature: 36.5 },
        { date: '2025-07-23', time: '10:00', temperature: 35.8 },
      ],
      diabetesLogs: [
        { date: '2025-07-26', time: '07:30', glucose: 165, measurementType: 'fasting', insulinType: 'Caninsulin', insulinDose: 4 },
        { date: '2025-07-26', time: '12:00', glucose: 240, measurementType: 'postMeal' }
      ],
      visitHistory: [
        {
          visitDate: '2025-07-25',
          clinicName: 'Happy Paws Clinic',
          vetName: 'Dr. Smith',
          nextVisitDate: '2025-08-10',
          symptoms: 'Coughing and sneezing',
          treatments: 'Antibiotic injection',
          medications: [
            { name: 'Amoxicillin', dosage: '50mg', frequency: '2x/day' }
          ],
          notes: 'Recommended rest and monitoring.',
          expanded: false
        },
        {
          visitDate: '2025-06-15',
          clinicName: 'VetCare Center',
          vetName: 'Dr. Lewis',
          symptoms: '',
          treatments: 'Annual vaccinations',
          medications: [],
          notes: '',
          nextVisitDate: '',
          expanded: false
        }
      ],
      // Nowe dane:
      weightHistory: [
        { date: '2025-07-27', weightKg: 32.5, bcs: 6, note: 'Utrzymać dawkę karmy' },
        { date: '2025-06-01', weightKg: 31.9, bcs: 5 },
        { date: '2025-04-15', weightKg: 31.2 }
      ],
      vaccinations: [
        { type: 'Wścieklizna', date: '2025-02-01', dueDate: '2026-02-01', product: 'Rabigen', batch: 'RB-21', vet: 'Dr. Lewis' },
        { type: 'DHPPi', date: '2025-02-01', dueDate: '2026-02-01', product: 'Nobivac', batch: 'NB-99', vet: 'Dr. Lewis' }
      ],
      medications: [
        { name: 'Carprofen', dose: '50 mg', frequency: '1x dziennie', timesOfDay: ['08:00'], startDate: '2025-07-20', isActive: true, notes: 'Podoawanie z jedzeniem' }
      ],
      symptoms: [
        { date: '2025-07-22', symptomTags: ['kaszel'], painScore: 2, energy: 3, appetite: 4, notes: 'Kaszel nocą' }
      ]
    },
    {
      id: 2,
      name: 'Mittens',
      species: 'cat',
      breed: 'Domestic shorthair',
      sex: 'female',
      weightKg: 4.1,
      birthDate: '2021-02-03',
      ownerName: 'Jane Smith',
      bloodTests: [],
      urineTests: [],
      stoolTests: [],
      temperatureLogs: [],
      diabetesLogs: [],
      visitHistory: [],
      weightHistory: [],
      vaccinations: [],
      medications: [],
      symptoms: []
    }
  ];

  renderBloodChart() {
    const canvas = document.getElementById('bloodChart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) this.chartInstance.destroy();

    const labels = this.animal.bloodTests.map(t => t.date);

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Hemoglobin (g/dL)',
            data: this.animal.bloodTests.map(t => t.hemoglobin),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            tension: 0.3
          },
          {
            label: 'WBC (10⁹/L)',
            data: this.animal.bloodTests.map(t => t.wbc),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: false,
            tension: 0.3
          },
          {
            label: 'Glucose (mg/dL)',
            data: this.animal.bloodTests.map(t => t.glucose),
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            fill: false,
            tension: 0.3
          },
          {
            label: 'Creatinine (mg/dL)',
            data: this.animal.bloodTests.map(t => t.creatinine),
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: false,
            tension: 0.3
          },
          {
            label: 'ALT (GPT)',
            data: this.animal.bloodTests.map(t => t.alt),
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            fill: false,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Selected Blood Test Trends' }
        },
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  renderTemperatureChart() {
    const canvas = document.getElementById('temperatureChart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (this.chartTempInstance) this.chartTempInstance.destroy();

    const labels = this.animal.temperatureLogs.map(t => `${t.date} ${t.time}`);
    const temps = this.animal.temperatureLogs.map(t => t.temperature);

    this.chartTempInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Temperature (°C)', data: temps, backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: 'Temperature Trends' } },
        scales: {
          y: { beginAtZero: false, title: { display: true, text: 'Temperature (°C)' } },
          x: { title: { display: true, text: 'Date & Time' } }
        }
      }
    });
  }

  loadAnimal() {
    const found = this.mockAnimals.find(a => a.id === this.animalId);
    if (!found) {
      this.router.navigateByUrl('/');
      return;
    }
    this.animal = {
      ...found,
      weightHistory: found.weightHistory ? [...found.weightHistory] : [],
      vaccinations: found.vaccinations ? [...found.vaccinations] : [],
      medications: found.medications ? [...found.medications] : [],
      symptoms: found.symptoms ? [...found.symptoms] : []
    };
  }

  setTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    setTimeout(() => {
      if (tab === 'blood') this.renderBloodChart();
      else if (tab === 'temperature') this.renderTemperatureChart();
    }, 0);
  }

  addNewDocument() {
    this.router.navigate(['/add-document'], { queryParams: { animalId: this.animal.id } });
  }

  getAgeYears(): number | null {
    if (!this.animal?.birthDate) return null;
    const dob = new Date(this.animal.birthDate);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  trackByIndex(i: number) { return i; }

  latest<T extends { date: string }>(arr: T[]): T | null {
    if (!arr?.length) return null;
    return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  }

  toggleDetails(visit: any) { visit.expanded = !visit.expanded; }

  /** ====== WAGA & BCS ====== */
  addWeight() {
    if (!this.animal) return;
    if (!this.weightForm.date || this.weightForm.weightKg == null) return;

    const entry: WeightEntry = {
      date: this.weightForm.date,
      weightKg: Number(this.weightForm.weightKg),
      bcs: this.weightForm.bcs != null ? Number(this.weightForm.bcs) : undefined,
      note: (this.weightForm.note || '').trim() || undefined
    };

    this.animal.weightHistory = [...(this.animal.weightHistory || []), entry];
    this.animal.weightKg = entry.weightKg; // aktualizacja nagłówka
    this.weightForm = {};
  }

  removeWeight(i: number) {
    if (!this.animal?.weightHistory) return;
    this.animal.weightHistory.splice(i, 1);
  }

  /** ====== SZCZEPIENIA ====== */
  addVaccination() {
    if (!this.animal) return;
    const v: Vaccination = {
      type: this.vaxForm.type!,
      date: this.vaxForm.date!,
      dueDate: this.vaxForm.dueDate || undefined,
      product: this.vaxForm.product?.trim(),
      batch: this.vaxForm.batch?.trim(),
      vet: this.vaxForm.vet?.trim(),
      notes: this.vaxForm.notes?.trim()
    };
    this.animal.vaccinations = [...(this.animal.vaccinations || []), v];
    this.vaxForm = {};
  }

  removeVaccination(i: number) { this.animal!.vaccinations!.splice(i, 1); }

  getDueStatus(due?: string | null): 'overdue' | 'due' | 'ok' | '—' {
    if (!due) return '—';
    const d = new Date(due);
    if (isNaN(d.getTime())) return '—';
    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < todayMid) return 'overdue';
    const days = Math.ceil((d.getTime() - todayMid.getTime()) / 86400000);
    return days <= 7 ? 'due' : 'ok';
  }

  /** ====== LEKI ====== */
  addMedication() {
    if (!this.animal) return;
    const times = (this.medForm.times || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => !!t);

    const m: MedicationPlan = {
      name: this.medForm.name,
      dose: this.medForm.dose,
      frequency: this.medForm.frequency,
      timesOfDay: times.length ? times : undefined,
      startDate: this.medForm.startDate,
      endDate: this.medForm.endDate || undefined,
      isActive: !!this.medForm.isActive,
      notes: this.medForm.notes?.trim()
    };

    this.animal.medications = [...(this.animal.medications || []), m];
    this.medForm = { isActive: true };
  }

  removeMedication(i: number) {
    this.animal!.medications!.splice(i, 1);
  }

  /** ====== OBJAWY ====== */
  addSymptom() {
    if (!this.animal) return;
    const tags = (this.symForm.symptomTags || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => !!t);

    const s: SymptomEntry = {
      date: this.symForm.date,
      symptomTags: tags,
      painScore: this.symForm.painScore != null ? Number(this.symForm.painScore) : undefined,
      energy: this.symForm.energy != null ? Number(this.symForm.energy) : undefined,
      appetite: this.symForm.appetite != null ? Number(this.symForm.appetite) : undefined,
      notes: this.symForm.notes?.trim()
    };

    this.animal.symptoms = [...(this.animal.symptoms || []), s];
    this.symForm = {};
  }

  removeSymptom(i: number) {
    this.animal!.symptoms!.splice(i, 1);
  }
}
