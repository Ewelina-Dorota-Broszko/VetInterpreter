import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VetService } from '../services/vet.service';

type DocType =
  | 'blood' | 'urine' | 'temperature' | 'weight'
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

  cards: Array<{ type: DocType; title: string; hint: string; route: string }> = [
    { type: 'blood',        title: 'Badanie krwi',       hint: 'Morfologia + biochemia',       route: '/form/blood' },
    { type: 'urine',        title: 'Badanie moczu',      hint: 'Parametry moczu',              route: '/form/urine' },
    { type: 'temperature',  title: 'Temperatura',        hint: 'Pojedynczy pomiar',            route: '/form/temperature' },
    { type: 'weight',       title: 'Waga & BCS',         hint: 'Masa ciała i kondycja',        route: '/form/weight' },
    { type: 'vaccination',  title: 'Szczepienie',        hint: 'Typ, data, przypomnienie',     route: '/form/vaccination' },
    { type: 'meds',         title: 'Lek',                hint: 'Dawka, częstość, okres',       route: '/form/meds' },
    { type: 'symptoms',     title: 'Objaw',              hint: 'Opis, nasilenie, czas trwania', route: '/form/symptoms' },
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

  open(type: DocType) {
    if (!this.animalId) {
      this.error = 'Podaj najpierw ID zwierzaka.';
      return;
    }
    const card = this.cards.find(c => c.type === type)!;
    this.router.navigate([card.route], { queryParams: { animalId: this.animalId } });
  }

  goBack() {
    // jeśli przyszliśmy z profilu zwierzaka – wróć tam; inaczej do listy pacjentów
    const backToAnimal = this.animal?._id;
    if (backToAnimal) {
      this.router.navigate(['/vet/animal', backToAnimal]);
    } else {
      this.router.navigate(['/vet/patients']);
    }
  }
}
