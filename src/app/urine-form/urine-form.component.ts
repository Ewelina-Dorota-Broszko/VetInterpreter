import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

type StripScale = 'neg' | 'trace' | '+' | '++' | '+++' | '++++' | string;

interface UrineFormModel {
  physicalChemical: {
    color: string;
    clarity: string;
    specificGravity: string; // wpis z inputa (zamienimy na number)
    pH: string;              // wpis z inputa (zamienimy na number)
    protein: StripScale;
    glucose: StripScale;
    ketones: StripScale;
    bilirubin: StripScale;
    urobilinogen: StripScale;
    blood: StripScale;
    nitrites: StripScale;
    leukocyteEsterase: StripScale;
  };
  microscopic: {
    wbc: string;
    rbc: string;
    epithelialCells: string;
    crystals: string;
    casts: string;
    bacteria: string;
    yeast: string;
    sperm: string;
    mucus: string;
    parasites: string;
  };
  testDate: string;  // YYYY-MM-DD (zamapujemy na "date")
  comments: string;
}

@Component({
  selector: 'app-urine-form',
  templateUrl: './urine-form.component.html',
  styleUrls: ['./urine-form.component.scss']
})
export class UrineFormComponent implements OnInit {
  /** Możesz przekazać z rodzica; jeśli brak, spróbujemy odczytać z URL-a */
  @Input() animalId?: string;

  formData: UrineFormModel = {
    physicalChemical: {
      color: '',
      clarity: '',
      specificGravity: '',
      pH: '',
      protein: '',
      glucose: '',
      ketones: '',
      bilirubin: '',
      urobilinogen: '',
      blood: '',
      nitrites: '',
      leukocyteEsterase: ''
    },
    microscopic: {
      wbc: '',
      rbc: '',
      epithelialCells: '',
      crystals: '',
      casts: '',
      bacteria: '',
      yeast: '',
      sperm: '',
      mucus: '',
      parasites: ''
    },
    testDate: '',
    comments: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    // 1) query param ?animalId=...
    if (!this.animalId) {
      const q = this.route.snapshot.queryParamMap.get('animalId');
      if (q) this.animalId = q;
    }
    // 2) param ścieżki /animals/:animalId/...
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
    // Minimalna walidacja pod wymagane pola backendu:
    const pc = this.formData.physicalChemical;
    if (!this.formData.testDate || !pc.color || !pc.specificGravity || !pc.pH || !pc.protein || !pc.glucose || !pc.ketones) {
      this.error = 'Uzupełnij: datę, kolor, SG, pH oraz białko, glukozę i ketony.';
      return;
    }

    // Bezpieczne konwersje liczbowych:
    const sgNum = Number(pc.specificGravity);
    const phNum = Number(pc.pH);
    if (Number.isNaN(sgNum) || Number.isNaN(phNum)) {
      this.error = 'SG i pH muszą być liczbami.';
      return;
    }

    // Spłaszczenie pod backend (nasz model Mongoose ma pola płaskie + "date")
    const payload = {
      date: this.formData.testDate, // mapujemy testDate → date
      // fizykochemia
      color: pc.color,
      clarity: pc.clarity,
      specificGravity: sgNum,
      pH: phNum,
      protein: pc.protein,
      glucose: pc.glucose,
      ketones: pc.ketones,
      bilirubin: pc.bilirubin,
      urobilinogen: pc.urobilinogen,
      blood: pc.blood,
      nitrites: pc.nitrites,
      leukocyteEsterase: pc.leukocyteEsterase,
      // mikroskopia
      wbc: this.formData.microscopic.wbc,
      rbc: this.formData.microscopic.rbc,
      epithelialCells: this.formData.microscopic.epithelialCells,
      crystals: this.formData.microscopic.crystals,
      casts: this.formData.microscopic.casts,
      bacteria: this.formData.microscopic.bacteria,
      yeast: this.formData.microscopic.yeast,
      sperm: this.formData.microscopic.sperm,
      mucus: this.formData.microscopic.mucus,
      parasites: this.formData.microscopic.parasites,
      // inne
      comments: this.formData.comments
    };

    this.saving = true;
    this.animals.addUrineTest(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Badanie zapisane.';
        this.saving = false;
        this.resetForm();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Nie udało się zapisać badania.';
        this.saving = false;
      }
    });
  }

  private resetForm() {
    this.formData = {
      physicalChemical: {
        color: '',
        clarity: '',
        specificGravity: '',
        pH: '',
        protein: '',
        glucose: '',
        ketones: '',
        bilirubin: '',
        urobilinogen: '',
        blood: '',
        nitrites: '',
        leukocyteEsterase: ''
      },
      microscopic: {
        wbc: '',
        rbc: '',
        epithelialCells: '',
        crystals: '',
        casts: '',
        bacteria: '',
        yeast: '',
        sperm: '',
        mucus: '',
        parasites: ''
      },
      testDate: '',
      comments: ''
    };
  }
}
