import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetService } from '../services/vet.service';

// jeśli masz interfejsy BloodTest/UrineTest itd. – możesz je tu zaimportować.
// Dla prostoty biorę typ `any`, ale filtr zachowuje kształt obiektów.

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

  // tylko wpisy dodane przez wetów
  bloodTestsVet: any[] = [];
  urineTestsVet: any[] = [];
  stoolTestsVet: any[] = [];
  temperatureLogsVet: any[] = [];
  diabetesLogsVet: any[] = [];
  weightHistoryVet: any[] = [];
  vaccinationsVet: any[] = [];
  medicationsVet: any[] = [];
  symptomsVet: any[] = [];

  // zakresy (jak w profilu ownera – jeżeli używasz ich w blood-tab)
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
    private vet: VetService
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
    console.log('[VetAnimalProfile] fetching /vets/animals/' + animalId);

    this.vet.getAnimalAsVet(animalId).subscribe({
      next: (animal) => {
        this.animal = animal;
        this.splitVetOnly();
        this.loading = false;
        // domyślnie przejdź do krwi / lub zostaw overview
        this.activeTab = 'blood';
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się pobrać zwierzaka.';
        this.loading = false;
      }
    });
  }

  /** odfiltruj tylko wpisy dodane przez weterynarzy */
  private onlyVet<T extends { addedByRole?: string }>(arr?: T[]): T[] {
    if (!Array.isArray(arr)) return [];
    return arr.filter(x => (x as any).addedByRole === 'vet') as T[];
  }

  private splitVetOnly() {
    const a = this.animal || {};
    this.bloodTestsVet       = this.onlyVet(a.bloodTests);
    this.urineTestsVet       = this.onlyVet(a.urineTests);
    this.stoolTestsVet       = this.onlyVet(a.stoolTests);
    this.temperatureLogsVet  = this.onlyVet(a.temperatureLogs);
    this.diabetesLogsVet     = this.onlyVet(a.diabetesLogs);
    this.weightHistoryVet    = this.onlyVet(a.weightHistory);
    this.vaccinationsVet     = this.onlyVet(a.vaccinations);
    this.medicationsVet      = this.onlyVet(a.medications);
    this.symptomsVet         = this.onlyVet(a.symptoms);
  }

  /* ===== Zakładki ===== */
  setTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
  }

  /* ===== Akcje – przejście do formularzy z ?animalId=... ===== */
  // addDoc(kind: 'blood'|'urine'|'temperature'|'weight'|'vaccination'|'meds'|'symptoms') {
  //   if (!this.animal?._id) return;
  //   const map: Record<string, string> = {
  //     blood: 'form/blood',
  //     urine: 'form/urine',
  //     temperature: 'form/temperature',
  //     weight: 'form/weight',
  //     vaccination: 'form/vaccination',
  //     meds: 'form/meds',
  //     symptoms: 'form/symptoms'
  //   };
  //   this.router.navigate(['/', map[kind]], { queryParams: { animalId: this.animal._id } });
  // }
  addDoc(kind: 'blood'|'urine'|'temperature'|'weight'|'vaccination'|'meds'|'symptoms') {
  if (!this.animal?._id) return;

  // absolutny URL, zero dwuznaczności z child-routes
  this.router.navigateByUrl(
    `/vet/add-document?animalId=${this.animal._id}&kind=${kind}`
  );}

  /* ===== Pomocnicze ===== */
  getAgeYears(): number | null {
    if (!this.animal?.birthDate) return null;
    const birth = new Date(this.animal.birthDate);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }
}
