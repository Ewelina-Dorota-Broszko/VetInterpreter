import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

type Num = number | '' ;

@Component({
  selector: 'app-blood-form',
  templateUrl: './blood-form.component.html',
  styleUrls: ['./blood-form.component.scss']
})
export class BloodFormComponent implements OnInit {
  /** Możesz przekazać z rodzica; jeśli brak, pobierzemy z query param ?animalId= lub ze ścieżki */
  @Input() animalId?: string;

  formData = {
    morphology: {
      hemoglobin: '' as Num,    // g/dL
      rbc: '' as Num,           // 10^12/L
      wbc: '' as Num,           // 10^9/L
      hematocrit: '' as Num,    // %
      platelets: '' as Num,     // 10^9/L
      mcv: '' as Num,           // fL
      mch: '' as Num,           // pg
      mchc: '' as Num           // g/dL
    },
    biochemistry: {
      glucose: '' as Num,           // mg/dL
      urea: '' as Num,              // mg/dL
      creatinine: '' as Num,        // mg/dL
      alt: '' as Num,               // U/L
      ast: '' as Num,               // U/L
      alp: '' as Num,               // U/L
      totalProtein: '' as Num,      // g/dL
      albumin: '' as Num,           // g/dL
      globulin: '' as Num,          // g/dL
      bilirubinTotal: '' as Num,    // mg/dL
      bilirubinDirect: '' as Num,   // mg/dL
      bilirubinIndirect: '' as Num  // mg/dL
    },
    other: {
      comments: '',
      testDate: '' // YYYY-MM-DD
    }
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    if (!this.animalId) {
      const q = this.route.snapshot.queryParamMap.get('animalId');
      if (q) this.animalId = q;
    }
    if (!this.animalId) {
      const p = this.route.snapshot.paramMap.get('animalId');
      if (p) this.animalId = p;
    }
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.other.testDate) {
      this.error = 'Uzupełnij datę badania.';
      return;
    }

    // Zbierz i spłaszcz payload pod backend (tak jak w innych formach)
    const m = this.formData.morphology;
    const b = this.formData.biochemistry;

    const payload: any = {
      date: this.formData.other.testDate,
      comments: this.formData.other.comments,

      // Morfologia
      hemoglobin: toNum(m.hemoglobin),
      rbc: toNum(m.rbc),
      wbc: toNum(m.wbc),
      hematocrit: toNum(m.hematocrit),
      platelets: toNum(m.platelets),
      mcv: toNum(m.mcv),
      mch: toNum(m.mch),
      mchc: toNum(m.mchc),

      // Biochemia
      glucose: toNum(b.glucose),
      urea: toNum(b.urea),
      creatinine: toNum(b.creatinine),
      alt: toNum(b.alt),
      ast: toNum(b.ast),
      alp: toNum(b.alp),
      totalProtein: toNum(b.totalProtein),
      albumin: toNum(b.albumin),
      globulin: toNum(b.globulin),
      bilirubinTotal: toNum(b.bilirubinTotal),
      bilirubinDirect: toNum(b.bilirubinDirect),
      bilirubinIndirect: toNum(b.bilirubinIndirect)
    };

    this.saving = true;
    this.animals.addBloodTest(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Badanie krwi zapisane.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać badania.';
        this.saving = false;
      }
    });

    function toNum(v: Num): number | undefined {
      if (v === '' || v === null || v === undefined) return undefined; // nie wysyłaj pustych
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    }
  }

  private resetForm() {
    this.formData = {
      morphology: {
        hemoglobin: '',
        rbc: '',
        wbc: '',
        hematocrit: '',
        platelets: '',
        mcv: '',
        mch: '',
        mchc: ''
      },
      biochemistry: {
        glucose: '',
        urea: '',
        creatinine: '',
        alt: '',
        ast: '',
        alp: '',
        totalProtein: '',
        albumin: '',
        globulin: '',
        bilirubinTotal: '',
        bilirubinDirect: '',
        bilirubinIndirect: ''
      },
      other: {
        comments: '',
        testDate: ''
      }
    };
  }
}
