import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetService } from '../services/vet.service';

type DocType =
  | 'overview' | 'blood' | 'urine' | 'stool'
  | 'temperature' | 'diabetes' | 'weight'
  | 'vaccination' | 'meds' | 'symptoms';

@Component({
  selector: 'app-vet-add-document',
  templateUrl: './vet-add-document.component.html',
  styleUrls: ['./vet-add-document.component.scss']
})
export class VetAddDocumentComponent implements OnInit {
  animalId: string | null = null;
  animal: any = null;

  loading = false;
  error = '';

  /** Lista wszystkich możliwych typów dokumentów (zgodna z zakładkami dashboardu) */
  cards: Array<{ type: DocType; title: string; hint: string; route: string }> = [
    // { type: 'overview',     title: 'Podsumowanie',      hint: 'Szybki przegląd historii i badań', route: '/vet/overview' },
    { type: 'blood',        title: 'Badanie krwi',      hint: 'Morfologia + biochemia',           route: '/form/blood' },
    { type: 'urine',        title: 'Badanie moczu',     hint: 'Parametry fizykochemiczne',        route: '/form/urine' },
    { type: 'stool',        title: 'Badanie kału',      hint: 'Pasożyty, bakterie, trawienie',    route: '/form/stool' },
    { type: 'temperature',  title: 'Temperatura',       hint: 'Pojedynczy pomiar temperatury',    route: '/form/temperature' },
    { type: 'diabetes',     title: 'Cukrzyca',          hint: 'Pomiar glukozy, insuliny, ketonów',route: '/form/diabetes' },
    { type: 'weight',       title: 'Waga & BCS',        hint: 'Masa ciała i kondycja zwierzęcia', route: '/form/weight' },
    { type: 'vaccination',  title: 'Szczepienie',       hint: 'Rodzaj, data, przypomnienie',      route: '/form/vaccination' },
    { type: 'meds',         title: 'Leki',              hint: 'Dawkowanie i okres leczenia',      route: '/form/meds' },
    { type: 'symptoms',     title: 'Objawy',            hint: 'Opis, nasilenie, czas trwania',    route: '/form/symptoms' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vet: VetService
  ) {}

  ngOnInit(): void {
    const qId = this.route.snapshot.queryParamMap.get('animalId');
    if (qId) {
      this.setAnimalId(qId);
    }
  }

  setAnimalId(id: string) {
    this.error = '';
    this.animalId = (id || '').trim() || null;
    this.animal = null;
    if (!this.animalId) return;

    this.loading = true;
    this.vet.getAnimalAsVet(this.animalId).subscribe({
      next: (a) => { this.animal = a; this.loading = false; },
      error: (e) => {
        this.error = e?.error?.error || 'Nie udało się pobrać zwierzaka po ID.';
        this.loading = false;
      }
    });
  }

  /** Otwiera wybrany formularz na podstawie typu dokumentu */
  open(type: DocType) {
    if (!this.animalId) {
      this.error = 'Podaj najpierw ID zwierzaka.';
      return;
    }
    const card = this.cards.find(c => c.type === type)!;
    this.router.navigate([card.route], { queryParams: { animalId: this.animalId } });
  }

  /** Powrót do profilu zwierzaka lub listy pacjentów */
  goBack() {
    const backToAnimal = this.animal?._id;
    if (backToAnimal) {
      this.router.navigate(['/vet/animal', backToAnimal]);
    } else {
      this.router.navigate(['/vet/patients']);
    }
  }
}
