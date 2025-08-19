import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AnimalsService } from '../services/animals.service';

@Component({
  selector: 'app-vaccination-form',
  templateUrl: './vaccination-form.component.html',
  styleUrls: ['./vaccination-form.component.scss']
})
export class VaccinationFormComponent implements OnInit {
  animalId: string | null = null;

  // Opcje typu szczepienia (wspólne – pies/kot + inne)
  // Opcje typu szczepienia (pies + kot + inne)
typeOptions = [
  { value: 'rabies',     label: 'Wścieklizna' },
  { value: 'dhpp',       label: 'DHP/DHPP (nosówka, HCC, parwo ± parainfluenza)' },
  { value: 'lepto',      label: 'Leptospiroza' },
  { value: 'bord',       label: 'Bordetella (kaszel kenelowy)' },
  { value: 'lyme',       label: 'Borelioza (Lyme disease)' },
  { value: 'influenza',  label: 'Grypa psów (CIV)' },
  { value: 'fvrcp',      label: 'FVRCP (kot: herpes, kalici, panleukopenia)' },
  { value: 'felv',       label: 'FeLV (kot: białaczka)' },
  { value: 'fiv',        label: 'FIV (kot: wirus niedoboru odporności)' },
  { value: 'chlamydia',  label: 'Chlamydioza kotów' },
  { value: 'other',      label: 'Inne' }
];

// Lista produktów do każdego typu
productOptions: Record<string, string[]> = {
  rabies: [
    'Nobivac Rabies',
    'Rabisin',
    'Biocan R',
    'Defensor',
    'Inny'
  ],
  dhpp: [
    'Nobivac DHPPi',
    'Eurican DHPPI2-LR',
    'Biocan DHPPi',
    'Canigen DHPPi/L',
    'Inny'
  ],
  lepto: [
    'Nobivac L4',
    'Versican Plus L4',
    'Biocan L',
    'Canigen L',
    'Inny'
  ],
  bord: [
    'Nobivac KC',
    'Versican Plus Bb Oral',
    'Inny'
  ],
  lyme: [
    'Nobivac Lyme',
    'Versican Plus Lyme',
    'Inny'
  ],
  influenza: [
    'Nobivac CIV',
    'FluSure Canine',
    'Inny'
  ],
  fvrcp: [
    'Purevax RCP',
    'Felocell RCP',
    'Feligen CRP',
    'Versifel CVR',
    'Inny'
  ],
  felv: [
    'Purevax FeLV',
    'Leucogen',
    'Leucocell',
    'Inny'
  ],
  fiv: [
    'Fel-O-Vax FIV',
    'Inny'
  ],
  chlamydia: [
    'Felocell CVR-C',
    'Feligen CRP + Chlamydia',
    'Inny'
  ],
  other: ['Inny']
};


  formData = {
    type: '',
    date: '',
    dueDate: '',
    productSelect: '',   // wybór z listy
    productCustom: '',   // gdy wybrano "Inny"
    batch: '',
    vet: '',
    notes: ''
  };

  saving = false;
  okMsg = '';
  error = '';

  constructor(private route: ActivatedRoute, private animals: AnimalsService) {}

  ngOnInit(): void {
    this.animalId = this.route.snapshot.queryParamMap.get('animalId');
  }

  get showProductSelect(): boolean {
    return !!this.formData.type;
  }

  get productList(): string[] {
    return this.formData.type ? (this.productOptions[this.formData.type] || ['Inny']) : [];
  }

  get showCustomProduct(): boolean {
    return this.formData.productSelect === 'Inny' || this.formData.type === 'other';
  }

  submitForm() {
    this.okMsg = '';
    this.error = '';

    if (!this.animalId) {
      this.error = 'Brak ID zwierzęcia – otwórz formularz z wybranym pacjentem.';
      return;
    }
    if (!this.formData.type || !this.formData.date) {
      this.error = 'Uzupełnij typ szczepienia i datę wykonania.';
      return;
    }

    // Ustal produkt do wysłania
    const product =
      this.showCustomProduct
        ? (this.formData.productCustom || '')
        : (this.formData.productSelect || '');

    const payload = {
      type: this.formData.type,
      date: this.formData.date,
      dueDate: this.formData.dueDate || undefined,
      product: product || undefined,
      batch: this.formData.batch || undefined,
      vet: this.formData.vet || undefined,
      notes: this.formData.notes || undefined
    };

    this.saving = true;
    this.animals.addVaccination(this.animalId, payload).subscribe({
      next: () => {
        this.okMsg = 'Szczepienie zapisane.';
        this.saving = false;
        this.resetForm();
      },
      error: () => {
        this.error = 'Nie udało się zapisać szczepienia.';
        this.saving = false;
      }
    });
  }

  private resetForm() {
    this.formData = {
      type: '',
      date: '',
      dueDate: '',
      productSelect: '',
      productCustom: '',
      batch: '',
      vet: '',
      notes: ''
    };
  }
}
