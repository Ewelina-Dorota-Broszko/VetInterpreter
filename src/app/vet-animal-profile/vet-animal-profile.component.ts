import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetService } from '../services/vet.service';
import { AnimalsService, TemperatureLog } from '../services/animals.service';

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

  // dane vet-only do kart
  bloodTestsVet: any[] = [];
  urineTestsVet: any[] = [];
  stoolTestsVet: any[] = [];
  temperatureLogsVet: TemperatureLog[] = [];
  diabetesLogsVet: any[] = [];
  weightHistoryVet: any[] = [];
  vaccinationsVet: any[] = [];
  medicationsVet: any[] = [];
  symptomsVet: any[] = [];

  // stany ładowania (lazy load per tab)
  loadingBlood = false;      bloodLoaded = false;      bloodError = '';
  loadingUrine = false;      urineLoaded = false;      urineError = '';
  loadingStool = false;      stoolLoaded = false;      stoolError = '';
  loadingTemperature = false;temperatureLoaded = false;temperatureError = '';
  loadingDiabetes = false;   diabetesLoaded = false;   diabetesError = '';
  loadingWeight = false;     weightLoaded = false;     weightError = '';
  loadingVacc = false;       vaccLoaded = false;       vaccError = '';
  loadingMeds = false;       medsLoaded = false;       medsError = '';
  loadingSymptoms = false;   symptomsLoaded = false;   symptomsError = '';

  // zakresy do blood-tab (jak wcześniej)
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
      this.fetchHeader(id);
    });
  }

  /** Pobierz nagłówek zwierzaka (nazwa, właściciel, itp.) */
  private fetchHeader(animalId: string) {
    this.loading = true;
    this.error = '';
    this.vet.getAnimalAsVet(animalId).subscribe({
      next: (animal) => {
        this.animal = animal;
        this.loading = false;

        // wyczyść stany (zmiana pacjenta)
        this.resetDataStates();

        // ustaw domyślną zakładkę i dociągnij jej dane
        this.setTab('blood');
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się pobrać zwierzaka.';
        this.loading = false;
      }
    });
  }

  private resetDataStates() {
    this.bloodTestsVet = [];   this.bloodLoaded = false;   this.bloodError = '';
    this.urineTestsVet = [];   this.urineLoaded = false;   this.urineError = '';
    this.stoolTestsVet = [];   this.stoolLoaded = false;   this.stoolError = '';
    this.temperatureLogsVet = []; this.temperatureLoaded = false; this.temperatureError = '';
    this.diabetesLogsVet = []; this.diabetesLoaded = false; this.diabetesError = '';
    this.weightHistoryVet = []; this.weightLoaded = false;  this.weightError = '';
    this.vaccinationsVet = []; this.vaccLoaded = false;     this.vaccError = '';
    this.medicationsVet = [];  this.medsLoaded = false;     this.medsError = '';
    this.symptomsVet = [];     this.symptomsLoaded = false; this.symptomsError = '';
  }

  /* ===== Zakładki ===== */
  setTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    if (!this.animal?._id) return;

    switch (tab) {
      case 'blood':        if (!this.bloodLoaded)       this.loadBloodVet(); break;
      case 'urine':        if (!this.urineLoaded)       this.loadUrineVet(); break;
      case 'stool':        if (!this.stoolLoaded)       this.loadStoolVet(); break;
      case 'temperature':  if (!this.temperatureLoaded) this.loadTemperatureVet(); break;
      case 'diabetes':     if (!this.diabetesLoaded)    this.loadDiabetesVet(); break;
      case 'weight':       if (!this.weightLoaded)      this.loadWeightVet(); break;
      case 'vaccinations': if (!this.vaccLoaded)        this.loadVaccinationsVet(); break;
      case 'meds':         if (!this.medsLoaded)        this.loadMedicationsVet(); break;
      case 'symptoms':     if (!this.symptomsLoaded)    this.loadSymptomsVet(); break;
      default: break;
    }
  }

  /* ===== Ładowania vet-only z backendu (?mine=1) ===== */

  private loadBloodVet() {
    if (!this.animal?._id) return;
    this.loadingBlood = true; this.bloodError = '';
    this.animals.getBloodTestsVet(this.animal._id).subscribe({
      next: rows => { this.bloodTestsVet = rows || []; this.bloodLoaded = true; this.loadingBlood = false; },
      error: () => { this.bloodError = 'Nie udało się pobrać badań krwi.'; this.loadingBlood = false; }
    });
  }

  private loadUrineVet() {
    if (!this.animal?._id) return;
    this.loadingUrine = true; this.urineError = '';
    this.animals.getUrineTestsVet(this.animal._id).subscribe({
      next: rows => { this.urineTestsVet = rows || []; this.urineLoaded = true; this.loadingUrine = false; },
      error: () => { this.urineError = 'Nie udało się pobrać badań moczu.'; this.loadingUrine = false; }
    });
  }

  private loadStoolVet() {
    if (!this.animal?._id) return;
    this.loadingStool = true; this.stoolError = '';
    this.animals.getStoolTestsVet(this.animal._id).subscribe({
      next: rows => { this.stoolTestsVet = rows || []; this.stoolLoaded = true; this.loadingStool = false; },
      error: () => { this.stoolError = 'Nie udało się pobrać badań kału.'; this.loadingStool = false; }
    });
  }

  private loadTemperatureVet() {
    if (!this.animal?._id) return;
    this.loadingTemperature = true; this.temperatureError = '';
    this.animals.getTemperatureLogsVet(this.animal._id).subscribe({
      next: rows => { this.temperatureLogsVet = rows || []; this.temperatureLoaded = true; this.loadingTemperature = false; },
      error: () => { this.temperatureError = 'Nie udało się pobrać pomiarów temperatury.'; this.loadingTemperature = false; }
    });
  }

  private loadDiabetesVet() {
    if (!this.animal?._id) return;
    this.loadingDiabetes = true; this.diabetesError = '';
    this.animals.getDiabetesLogsVet(this.animal._id).subscribe({
      next: rows => { this.diabetesLogsVet = rows || []; this.diabetesLoaded = true; this.loadingDiabetes = false; },
      error: () => { this.diabetesError = 'Nie udało się pobrać wpisów cukrzycy.'; this.loadingDiabetes = false; }
    });
  }

  private loadWeightVet() {
    if (!this.animal?._id) return;
    this.loadingWeight = true; this.weightError = '';
    this.animals.getWeightHistoryVet(this.animal._id).subscribe({
      next: rows => { this.weightHistoryVet = rows || []; this.weightLoaded = true; this.loadingWeight = false; },
      error: () => { this.weightError = 'Nie udało się pobrać historii wagi.'; this.loadingWeight = false; }
    });
  }

  private loadVaccinationsVet() {
    if (!this.animal?._id) return;
    this.loadingVacc = true; this.vaccError = '';
    this.animals.getVaccinationsVet(this.animal._id).subscribe({
      next: rows => { this.vaccinationsVet = rows || []; this.vaccLoaded = true; this.loadingVacc = false; },
      error: () => { this.vaccError = 'Nie udało się pobrać szczepień.'; this.loadingVacc = false; }
    });
  }

  private loadMedicationsVet() {
    if (!this.animal?._id) return;
    this.loadingMeds = true; this.medsError = '';
    this.animals.getMedicationsVet(this.animal._id).subscribe({
      next: rows => { this.medicationsVet = rows || []; this.medsLoaded = true; this.loadingMeds = false; },
      error: () => { this.medsError = 'Nie udało się pobrać leków.'; this.loadingMeds = false; }
    });
  }

  private loadSymptomsVet() {
    if (!this.animal?._id) return;
    this.loadingSymptoms = true; this.symptomsError = '';
    this.animals.getSymptomsVet(this.animal._id).subscribe({
      next: rows => { this.symptomsVet = rows || []; this.symptomsLoaded = true; this.loadingSymptoms = false; },
      error: () => { this.symptomsError = 'Nie udało się pobrać objawów.'; this.loadingSymptoms = false; }
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
