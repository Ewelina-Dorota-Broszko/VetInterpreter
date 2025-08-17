import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { AnimalsService } from '../services/animals.service';

@Component({
  selector: 'app-animal-profile',
  templateUrl: './animal-profile.component.html',
  styleUrls: ['./animal-profile.component.scss']
})
export class AnimalProfileComponent implements OnInit {
  animal: any;
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

  private chartInstance: Chart | null = null;
  private chartTempInstance: Chart | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private animalsService: AnimalsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.router.navigateByUrl('/dashboard');
        return;
      }
      this.loadAnimal(id);
    });
  }

  /** Pobranie zwierzaka z backendu */
  private loadAnimal(id: string) {
    this.animalsService.getById(id).subscribe({
      next: (res: any) => {
        this.animal = res;
        // jeśli użytkownik jest już na zakładce z wykresami, odśwież wykres
        setTimeout(() => {
          if (this.activeTab === 'blood') this.renderBloodChart();
          if (this.activeTab === 'temperature') this.renderTemperatureChart();
        }, 0);
      },
      error: (err: any) => {
        console.error('Błąd pobierania zwierzaka:', err);
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

  /** Zakładki */
  setTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    // daj DOM-owi czas na wyrenderowanie <canvas>
    setTimeout(() => {
      if (tab === 'blood') this.renderBloodChart();
      if (tab === 'temperature') this.renderTemperatureChart();
    }, 0);
  }

  /** ====== Wykresy ====== */
  private renderBloodChart() {
    if (!this.animal?.bloodTests?.length) return;

    const canvas = document.getElementById('bloodChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) this.chartInstance.destroy();

    const labels = this.animal.bloodTests.map((t: any) => t.date);
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'HGB (g/dL)', data: this.animal.bloodTests.map((t: any) => t.hemoglobin), fill: false, tension: 0.3 },
          { label: 'WBC (10⁹/L)', data: this.animal.bloodTests.map((t: any) => t.wbc), fill: false, tension: 0.3 },
          { label: 'Glukoza (mg/dL)', data: this.animal.bloodTests.map((t: any) => t.glucose), fill: false, tension: 0.3 },
          { label: 'Kreatynina (mg/dL)', data: this.animal.bloodTests.map((t: any) => t.creatinine), fill: false, tension: 0.3 },
          { label: 'ALT (U/L)', data: this.animal.bloodTests.map((t: any) => t.alt), fill: false, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Trendy wybranych parametrów krwi' } },
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  private renderTemperatureChart() {
    if (!this.animal?.temperatureLogs?.length) return;

    const canvas = document.getElementById('temperatureChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartTempInstance) this.chartTempInstance.destroy();

    const labels = this.animal.temperatureLogs.map((t: any) => `${t.date} ${t.time}`);
    const temps = this.animal.temperatureLogs.map((t: any) => t.temperature);

    this.chartTempInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Temperatura (°C)', data: temps }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: 'Pomiary temperatury' } },
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  /** ====== Pomocnicze ====== */
  getAgeYears(): number | null {
    if (!this.animal?.birthDate) return null;
    const birth = new Date(this.animal.birthDate);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  trackByIndex(i: number) { return i; }

  latest<T extends { date: string }>(arr: T[]): T | null {
    if (!arr?.length) return null;
    return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  }

  toggleDetails(visit: any) { visit.expanded = !visit.expanded; }

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
    bilirubinIndirect: { min: 0.1, max: 1.0, unit: 'mg/dL' }
  };

  getRangeText(param: keyof typeof this.referenceRanges): string {
    const r = this.referenceRanges[param];
    return `(${r.min}–${r.max} ${r.unit})`;
  }

  getValueStatus(value: number, param: keyof typeof this.referenceRanges): 'low' | 'normal' | 'high' {
    const r = this.referenceRanges[param];
    if (value == null) return 'normal';
    if (value < r.min) return 'low';
    if (value > r.max) return 'high';
    return 'normal';
  }

  /** Przycisk w nagłówku */
  addNewDocument() {
    if (!this.animal?._id) return;
    this.router.navigate(['/add-document'], { queryParams: { animalId: this.animal._id } });
  }
}
