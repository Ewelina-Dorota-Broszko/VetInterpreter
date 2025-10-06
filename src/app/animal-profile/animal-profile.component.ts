import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { AnimalsService } from '../services/animals.service';
import { VetService } from '../services/vet.service';

type ScopeOwner = 'all' | 'owner' | 'vet';

@Component({
  selector: 'app-animal-profile',
  templateUrl: './animal-profile.component.html',
  styleUrls: ['./animal-profile.component.scss']
})
export class AnimalProfileComponent implements OnInit {
  animal: any;

  // filtr źródła wpisów
  scope: ScopeOwner = 'all';
  scopeLabel: Record<ScopeOwner, string> = {
    all: 'Wszystkie',
    owner: 'Tylko moje',
    vet: 'Tylko weterynarzy'
  };

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

  deleting = false;

  // modal profilu weta
  showVetModal = false;
  modalVetId: string | null = null;

  // zbiory po filtrze (to przekazujemy do tabów)
  bloodTestsFiltered: any[] = [];
  urineTestsFiltered: any[] = [];
  stoolTestsFiltered: any[] = [];
  temperatureLogsFiltered: any[] = [];
  diabetesLogsFiltered: any[] = [];
  weightHistoryFiltered: any[] = [];
  vaccinationsFiltered: any[] = [];
  medicationsFiltered: any[] = [];
  symptomsFiltered: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private animalsService: AnimalsService,
    private vetSvc: VetService
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

  onDeleteAnimal() {
    if (!this.animal?._id) return;
    const sure = confirm(`Na pewno usunąć ${this.animal.name}? Tej operacji nie można cofnąć.`);
    if (!sure) return;

    this.deleting = true;
    this.animalsService.deleteAnimal(this.animal._id).subscribe({
      next: () => {
        this.deleting = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.deleting = false;
        console.error('Błąd usuwania zwierzaka:', err);
        alert(err?.error?.error || 'Nie udało się usunąć zwierzaka.');
      }
    });
  }

  /** Pobranie zwierzaka z backendu */
  private loadAnimal(id: string) {
    this.animalsService.getById(id).subscribe({
      next: (res: any) => {
        this.animal = res;
        this.rebuildAllFiltered();

        // odśwież ewentualne lokalne wykresy w tej klasie
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
    // jeżeli używasz lokalnych wykresów zamiast tych w child-komponentach
    setTimeout(() => {
      if (tab === 'blood') this.renderBloodChart();
      if (tab === 'temperature') this.renderTemperatureChart();
    }, 0);
  }

  /** Reakcja na zmianę filtra */
  onScopeChange() {
    this.rebuildAllFiltered();
    setTimeout(() => {
      if (this.activeTab === 'blood') this.renderBloodChart();
      if (this.activeTab === 'temperature') this.renderTemperatureChart();
    }, 0);
  }

  /** ====== Filtracja wg scope ====== */
  private getScoped<T extends { addedBy?: string; addedByRole?: string }>(arr?: T[] | null): T[] {
    if (!Array.isArray(arr)) return [];
    if (this.scope === 'all') return [...arr];

    // 'owner' → wpisy dodane przez właściciela
    if (this.scope === 'owner') {
      return arr.filter(x => x.addedBy === 'owner');
    }

    // 'vet' → wpisy dodane przez weterynarzy
    return arr.filter(x => (x.addedBy === 'vet') || (x.addedByRole === 'vet'));
  }

  private rebuildAllFiltered() {
    const a = this.animal || {};

    this.bloodTestsFiltered      = this.getScoped(a.bloodTests);
    this.urineTestsFiltered      = this.getScoped(a.urineTests);
    this.stoolTestsFiltered      = this.getScoped(a.stoolTests);
    this.temperatureLogsFiltered = this.getScoped(a.temperatureLogs);
    this.diabetesLogsFiltered    = this.getScoped(a.diabetesLogs);
    this.weightHistoryFiltered   = this.getScoped(a.weightHistory);
    this.vaccinationsFiltered    = this.getScoped(a.vaccinations);
    this.medicationsFiltered     = this.getScoped(a.medications);
    this.symptomsFiltered        = this.getScoped(a.symptoms);
  }

  /** ====== (opcjonalne) Wykresy lokalne w tym komponencie ====== */
  private renderBloodChart() {
    // Uwaga: w tym widoku używasz <app-blood-tab>, więc ta metoda może nie być potrzebna.
    // Zostawiam – jeśli jednak masz lokalny <canvas id="bloodChart"> w innej wersji szablonu.
    if (!this.bloodTestsFiltered?.length) return;

    const canvas = document.getElementById('bloodChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) this.chartInstance.destroy();

    const labels = this.bloodTestsFiltered.map((t: any) => t.date);
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'HGB (g/dL)',       data: this.bloodTestsFiltered.map((t: any) => t.hemoglobin), fill: false, tension: 0.3 },
          { label: 'WBC (10⁹/L)',      data: this.bloodTestsFiltered.map((t: any) => t.wbc),       fill: false, tension: 0.3 },
          { label: 'Glukoza (mg/dL)',  data: this.bloodTestsFiltered.map((t: any) => t.glucose),   fill: false, tension: 0.3 },
          { label: 'Kreatynina (mg/dL)', data: this.bloodTestsFiltered.map((t: any) => t.creatinine), fill: false, tension: 0.3 },
          { label: 'ALT (U/L)',        data: this.bloodTestsFiltered.map((t: any) => t.alt),       fill: false, tension: 0.3 }
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
    // jw. – tylko jeśli masz <canvas id="temperatureChart">
    if (!this.temperatureLogsFiltered?.length) return;

    const canvas = document.getElementById('temperatureChart') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chartTempInstance) this.chartTempInstance.destroy();

    const labels = this.temperatureLogsFiltered.map((t: any) => `${t.date} ${t.time}`);
    const temps  = this.temperatureLogsFiltered.map((t: any) => t.temperature);

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
    hemoglobin: { min: 12, max: 18, unit: 'g/dL' },
    rbc: { min: 5.0, max: 8.5, unit: '10¹²/L' },
    wbc: { min: 6.0, max: 17.0, unit: '10⁹/L' },
    hematocrit: { min: 37, max: 55, unit: '%' },
    platelets: { min: 200, max: 500, unit: '10⁹/L' },
    mcv: { min: 80, max: 100, unit: 'fL' },
    mch: { min: 27, max: 33, unit: 'pg' },
    mchc: { min: 31, max: 36, unit: 'g/dL' },
    glucose: { min: 70, max: 140, unit: 'mg/dL' },
    urea: { min: 20, max: 55, unit: 'mg/dL' },
    creatinine: { min: 0.5, max: 1.5, unit: 'mg/dL' },
    alt: { min: 10, max: 100, unit: 'U/L' },
    ast: { min: 10, max: 100, unit: 'U/L' },
    alp: { min: 20, max: 150, unit: 'U/L' },
    totalProtein: { min: 5.5, max: 7.5, unit: 'g/dL' },
    albumin: { min: 2.5, max: 4.0, unit: 'g/dL' },
    globulin: { min: 2.5, max: 4.0, unit: 'g/dL' },
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

  goAssignVet() {
    if (!this.animal?._id) return;
    this.router.navigate(['/find-vet'], { queryParams: { animalId: this.animal._id } });
  }

  unassignVet() {
    if (!this.animal?._id) return;
    if (!confirm(`Odepnąć weterynarza od ${this.animal.name}?`)) return;

    this.vetSvc.unassignAnimalFromVet(this.animal._id).subscribe({
      next: () => this.animal.vetId = undefined,
      error: (e) => alert(e?.error?.error || 'Nie udało się odpiąć.')
    });
  }

  /* ======= Popup: profil weta ======= */
  openVetModal(vetId: string) {
    this.modalVetId = String(vetId);
    this.showVetModal = true;
  }
  closeVetModal() {
    this.showVetModal = false;
    this.modalVetId = null;
  }
}
