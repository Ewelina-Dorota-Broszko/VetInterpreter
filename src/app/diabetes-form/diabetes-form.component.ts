import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

type Num = number | '';

@Component({
  selector: 'app-diabetes-form',
  templateUrl: './diabetes-form.component.html',
  styleUrls: ['./diabetes-form.component.scss']
})
export class DiabetesFormComponent implements OnInit {
  animalId?: string;

  // gotowe opcje
  measurementTypes = [
    { value: 'fasting',  label: 'Na czczo' },
    { value: 'postMeal', label: 'Po posiłku' },
    { value: 'random',   label: 'Przypadkowy' },
  ];

  insulinOptions = [
    // weterynaryjne / najczęstsze
    'Caninsulin / Vetsulin (lente)',
    'ProZinc (PZI, protamine zinc insulin)',
    // ludzkie stosowane u zwierząt
    'Glargine (Lantus)',
    'Detemir (Levemir)',
    'Degludec (Tresiba)',
    'NPH (Neutral Protamine Hagedorn)',
    'Lispro (Humalog)',
    'Aspart (NovoRapid / Novolog)',
    'Regular (krótko działająca)',
    'Inna'
  ];

  formData = {
    date: '',
    time: '',
    glucose: '' as Num,
    measurementType: '',
    insulinTypeSelect: '',    // z listy powyżej
    insulinTypeCustom: '',    // gdy wybrano "Inna"
    insulinDose: '' as Num,
    comments: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    // weź animalId z query (?animalId=) albo ze ścieżki (/animals/:animalId/..)
    this.animalId = this.route.snapshot.queryParamMap.get('animalId') || undefined;
    if (!this.animalId) {
      const fromPath = this.route.snapshot.paramMap.get('animalId');
      if (fromPath) this.animalId = fromPath;
    }
  }

  get showCustomInsulin(): boolean {
    return this.formData.insulinTypeSelect === 'Inna';
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.date || !this.formData.time || this.formData.glucose === '' || !this.formData.measurementType) {
      this.error = 'Uzupełnij datę, godzinę, glukozę i rodzaj pomiaru.';
      return;
    }

    // ustalenie typu insuliny z selecta/custom
    let insulinTypeToSend = '';
    if (this.formData.insulinTypeSelect) {
      insulinTypeToSend = this.showCustomInsulin ? (this.formData.insulinTypeCustom || '') : this.formData.insulinTypeSelect;
    }

    const payload: any = {
      date: this.formData.date,
      time: this.formData.time,
      glucose: toNum(this.formData.glucose),
      measurementType: this.formData.measurementType,
      comments: this.formData.comments || ''
    };

    if (insulinTypeToSend) payload.insulinType = insulinTypeToSend;
    if (this.formData.insulinDose !== '') payload.insulinDose = toNum(this.formData.insulinDose);

    this.saving = true;
    this.animals.addDiabetesLog(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Wpis cukrzycowy zapisany.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać wpisu.';
        this.saving = false;
      }
    });

    function toNum(v: Num): number {
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    }
  }

  private resetForm() {
    this.formData = {
      date: '',
      time: '',
      glucose: '',
      measurementType: '',
      insulinTypeSelect: '',
      insulinTypeCustom: '',
      insulinDose: '',
      comments: ''
    };
  }
}
