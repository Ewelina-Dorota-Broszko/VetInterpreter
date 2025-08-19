import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

@Component({
  selector: 'app-urine-form',
  templateUrl: './urine-form.component.html',
  styleUrls: ['./urine-form.component.scss']
})
export class UrineFormComponent implements OnInit {
  animalId?: string;

  // Skala półilościowa (dipstick)
  stripOptions = [
    { value: 'neg',   label: 'Negatywny (brak)' },
    { value: 'trace', label: 'Śladowe ilości' },
    { value: '+',     label: '+ (mała ilość)' },
    { value: '++',    label: '++ (umiarkowana ilość)' },
    { value: '+++',   label: '+++ (duża ilość)' },
    { value: '++++',  label: '++++ (bardzo duża ilość)' },
  ];

  colors = ['słomkowy', 'żółty', 'ciemnożółty', 'bursztynowy', 'czerwony', 'brązowy', 'zielonkawy'];
  clarities = ['przejrzysty', 'lekko mętny', 'mętny'];

  wbcRanges = ['0-5 /HPF', '5-10 /HPF', '10-20 /HPF', '20-50 /HPF', '>50 /HPF'];
  rbcRanges = ['0-5 /HPF', '5-10 /HPF', '10-20 /HPF', '20-50 /HPF', '>50 /HPF'];

  quantity = ['brak', 'pojedyncze', 'nieliczne', 'umiarkowane', 'liczne'];
  crystalTypes = ['brak', 'struvity', 'szczawiany wapnia', 'moczany amonu', 'cystyna', 'inne'];

  formData = {
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
    this.animalId = this.route.snapshot.queryParamMap.get('animalId') || undefined;
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }

    const pc = this.formData.physicalChemical;
    if (!this.formData.testDate || !pc.color || !pc.specificGravity || !pc.pH) {
      this.error = 'Uzupełnij datę, kolor, SG i pH.';
      return;
    }

    const payload = {
      date: this.formData.testDate,
      ...pc,
      ...this.formData.microscopic,
      comments: this.formData.comments
    };

    this.saving = true;
    this.animals.addUrineTest(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Badanie moczu zapisane.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
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
