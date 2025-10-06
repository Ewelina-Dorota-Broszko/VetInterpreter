import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetService } from '../services/vet.service';
import { AnimalsService, TemperatureLog } from '../services/animals.service';

type Scope = 'mine' | 'vet' | 'owner' | 'all';

@Component({
  selector: 'app-vet-animal-profile',
  templateUrl: './vet-animal-profile.component.html',
  styleUrls: ['./vet-animal-profile.component.scss']
})
export class VetAnimalProfileComponent implements OnInit {
  loading = false;
  error = '';
  animal: any = null;

  // aktywna zakładka
  activeTab:
    | 'overview' | 'blood' | 'urine' | 'stool'
    | 'temperature' | 'diabetes' | 'weight'
    | 'vaccinations' | 'meds' | 'symptoms' = 'overview';

  // FILTR: domyślnie wet ogląda "mine"
  scope: Scope = 'mine';
  scopeLabel: Record<Scope, string> = {
    mine: 'Moje',
    vet: 'Wszyscy weterynarze',
    owner: 'Właściciel',
    all: 'Wszystkie'
  };

  // Bufory danych
  bloodTestsVet: any[] = [];
  urineTestsVet: any[] = [];
  stoolTestsVet: any[] = [];
  temperatureLogsVet: TemperatureLog[] = [];
  diabetesLogsVet: any[] = [];
  weightHistoryVet: any[] = [];
  vaccinationsVet: any[] = [];
  medicationsVet: any[] = [];
  symptomsVet: any[] = [];

  // zakresy (dla blood-tab)
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vet: VetService,
    private animals: AnimalsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (!id) {
        this.router.navigateByUrl('/vet/patients');
        return;
      }
      this.fetch(id);
    });
  }

  private fetch(animalId: string) {
    this.loading = true;
    this.error = '';

    this.vet.getAnimalAsVet(animalId).subscribe({
      next: (animal) => {
        this.animal = animal;
        this.loading = false;
        // start od krwi, a dane ładujemy wg wybranego filtra
        this.activeTab = 'blood';
        this.reloadActiveTab();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się pobrać zwierzaka.';
        this.loading = false;
      }
    });
  }

  /* ===== Zakładki ===== */
  setTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.reloadActiveTab();
  }

  onScopeChange() {
    this.reloadActiveTab();
  }

  /** Wywoływane przy zmianie scope i przy przełączaniu zakładek */
  reloadActiveTab() {
    if (!this.animal?._id) return;
    switch (this.activeTab) {
      case 'blood':        return this.loadBlood();
      case 'urine':        return this.loadUrine();
      case 'stool':        return this.loadStool();
      case 'temperature':  return this.loadTemperature();
      case 'diabetes':     return this.loadDiabetes();
      case 'weight':       return this.loadWeight();
      case 'vaccinations': return this.loadVaccinations();
      case 'meds':         return this.loadMeds();
      case 'symptoms':     return this.loadSymptoms();
      default: return;
    }
  }

  /* ===== ŁADOWANIE DANYCH WG SCOPE ===== */
  private loadBlood() {
    this.animals.getBloodTests(this.animal._id, this.scope).subscribe({
      next: rows => this.bloodTestsVet = [...(rows || [])],
      error: () => this.bloodTestsVet = []
    });
  }
  private loadUrine() {
    this.animals.getUrineTests(this.animal._id, this.scope).subscribe({
      next: rows => this.urineTestsVet = [...(rows || [])],
      error: () => this.urineTestsVet = []
    });
  }
  private loadStool() {
    this.animals.getStoolTests(this.animal._id, this.scope).subscribe({
      next: rows => this.stoolTestsVet = [...(rows || [])],
      error: () => this.stoolTestsVet = []
    });
  }
  private loadTemperature() {
    this.animals.getTemperatureLogs(this.animal._id, this.scope).subscribe({
      next: (rows: TemperatureLog[]) => this.temperatureLogsVet = [...(rows || [])],
      error: () => this.temperatureLogsVet = []
    });
  }
  private loadDiabetes() {
    this.animals.getDiabetesLogs(this.animal._id, this.scope).subscribe({
      next: rows => this.diabetesLogsVet = [...(rows || [])],
      error: () => this.diabetesLogsVet = []
    });
  }
  private loadWeight() {
    this.animals.getWeightHistory(this.animal._id, this.scope).subscribe({
      next: rows => this.weightHistoryVet = [...(rows || [])],
      error: () => this.weightHistoryVet = []
    });
  }
  private loadVaccinations() {
    this.animals.getVaccinations(this.animal._id, this.scope).subscribe({
      next: rows => this.vaccinationsVet = [...(rows || [])],
      error: () => this.vaccinationsVet = []
    });
  }
  private loadMeds() {
    this.animals.getMedications(this.animal._id, this.scope).subscribe({
      next: rows => this.medicationsVet = [...(rows || [])],
      error: () => this.medicationsVet = []
    });
  }
  private loadSymptoms() {
    this.animals.getSymptoms(this.animal._id, this.scope).subscribe({
      next: rows => this.symptomsVet = [...(rows || [])],
      error: () => this.symptomsVet = []
    });
  }

  /* ===== Akcje – przejście do formularzy ===== */
  addDoc(kind: 'blood'|'urine'|'temperature'|'weight'|'vaccination'|'meds'|'symptoms') {
    if (!this.animal?._id) return;
    this.router.navigateByUrl(
      `/vet/add-document?animalId=${encodeURIComponent(this.animal._id)}&kind=${encodeURIComponent(kind)}`
    );
  }

  /* ===== Pomocnicze ===== */
  getAgeYears(): number | null {
    if (!this.animal?.birthDate) return null;
    const birth = new Date(this.animal.birthDate);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }
}
