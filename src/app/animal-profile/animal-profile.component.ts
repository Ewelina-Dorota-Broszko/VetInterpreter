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

  // Other
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
}

@Component({
  selector: 'app-animal-profile',
  templateUrl: './animal-profile.component.html',
  styleUrls: ['./animal-profile.component.scss']
})
export class AnimalProfileComponent {
  animalId!: number;
  animal!: Animal;
  activeTab: 'overview' | 'blood' | 'urine' | 'stool' | 'temperature' | 'diabetes' = 'overview';

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
    alt: { min: 10, max: 100, unit: 'U/L' }, // GPT
    ast: { min: 10, max: 100, unit: 'U/L' }, // GOT
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
    hemoglobin: 11.5, // low
    rbc: 4.8,         // low
    wbc: 6.5,
    hematocrit: 35,   // low
    platelets: 190,   // low
    mcv: 76,          // low
    mch: 25,          // low
    mchc: 30,         // low
    glucose: 130,
    urea: 60,         // high
    creatinine: 1.6,  // high
    alt: 115,         // high
    ast: 95,
    alp: 160,         // high
    totalProtein: 5.3,// low
    albumin: 2.3,     // low
    globulin: 2.8,
    bilirubinTotal: 1.3,  // high
    bilirubinDirect: 0.35,// high
    bilirubinIndirect: 1.0,
    comments: 'Anemia suspected'
  },
  {
    date: '2025-05-10',
    hemoglobin: 15.5,
    rbc: 7.0,
    wbc: 16.5,
    hematocrit: 50,
    platelets: 420,
    mcv: 90,
    mch: 30,
    mchc: 34,
    glucose: 80,
    urea: 45,
    creatinine: 1.0,
    alt: 40,
    ast: 35,
    alp: 110,
    totalProtein: 7.0,
    albumin: 3.8,
    globulin: 3.2,
    bilirubinTotal: 1.0,
    bilirubinDirect: 0.2,
    bilirubinIndirect: 0.8,
    comments: 'Slightly elevated WBC'
  },
  {
    date: '2025-04-02',
    hemoglobin: 17.9,
    rbc: 8.4,
    wbc: 16.9,
    hematocrit: 54,
    platelets: 499,
    mcv: 99,
    mch: 32.5,
    mchc: 35.5,
    glucose: 139,
    urea: 50,
    creatinine: 1.3,
    alt: 75,
    ast: 82,
    alp: 100,
    totalProtein: 7.4,
    albumin: 4.0,
    globulin: 3.4,
    bilirubinTotal: 1.1,
    bilirubinDirect: 0.3,
    bilirubinIndirect: 0.8,
    comments: 'Values near upper range'
  }
]

      ,
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
      visitHistory: []
    }
  ];

renderBloodChart() {
  const canvas = document.getElementById('bloodChart') as HTMLCanvasElement;
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  if (this.chartInstance) {
    this.chartInstance.destroy();
  }

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
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}


  renderTemperatureChart() {
    const canvas = document.getElementById('temperatureChart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (this.chartTempInstance) {
      this.chartTempInstance.destroy();
    }

    const labels = this.animal.temperatureLogs.map(t => `${t.date} ${t.time}`);
    const temps = this.animal.temperatureLogs.map(t => t.temperature);

    this.chartTempInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temps,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Temperature Trends' }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Temperature (°C)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date & Time'
            }
          }
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
    this.animal = found;
  }

  setTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    setTimeout(() => {
      if (tab === 'blood') {
        this.renderBloodChart();
      } else if (tab === 'temperature') {
        this.renderTemperatureChart();
      }
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

  trackByIndex(i: number) {
    return i;
  }

  latest<T extends { date: string }>(arr: T[]): T | null {
    if (!arr?.length) return null;
    return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  }

  toggleDetails(visit: any) {
    visit.expanded = !visit.expanded;
  }
}
