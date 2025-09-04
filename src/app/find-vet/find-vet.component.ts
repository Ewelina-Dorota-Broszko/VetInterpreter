import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { VetService } from '../services/vet.service';
import { AnimalsService, Animal } from '../services/animals.service';
import { AuthService } from '../auth/auth.service';

type VetLite = {
  _id: string;
  clinicName: string;
  email?: string;
  phone?: string;
  about?: string;
  address?: { city?: string; line1?: string; line2?: string; postalCode?: string; country?: string };
  specialties?: string[];
};

type MyVetGroup = {
  vetId: string;                           // zawsze string
  vet?: VetLite;                           // uzupełniamy gdy się uda pobrać
  animals: (Animal & { vetId?: string })[]; // lista moich zwierzaków przypiętych do tego vetId
};

@Component({
  selector: 'app-find-vet',
  templateUrl: './find-vet.component.html',
  styleUrls: ['./find-vet.component.scss']
})
export class FindVetComponent implements OnInit {
  // katalog
  vets: VetLite[] = [];
  loading = false;
  error = '';

  // MOJA SEKCJA
  myVetGroups: MyVetGroup[] = [];
  myVetIds: string[] = [];
  loadingMyVets = false;

  // moje zwierzaki (dla selekta i grupowania)
  myAnimals: (Animal & { vetId?: string })[] = [];

  // akcje
  assigning: Record<string, boolean> = {};     // per vetId
  unassigning: Record<string, boolean> = {};   // per animalId

  // filtr / kontekst
  search = '';
  animalIdFromQuery?: string;
  selectedAnimalId?: string;

  constructor(
    private vetsSvc: VetService,
    private animalsSvc: AnimalsService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.animalIdFromQuery = this.route.snapshot.queryParamMap.get('animalId') || undefined;

    // 1) sekcja "Twoi weterynarze"
    this.loadMySection();

    // 2) katalog
    this.loadCatalog();

    // 3) selekt zwierzaków (gdy brak animalId w URL)
    if (!this.animalIdFromQuery) this.loadMyAnimalsForSelect();
  }

  /* ================= MOJA SEKCJA ================= */

  private loadMySection() {
    this.loadingMyVets = true;

    const ensureOwnerId$ = this.auth.getOwnerId()
      ? of(this.auth.getOwnerId()!)
      : this.auth.fetchMe().pipe(map(() => this.auth.getOwnerId()!));

    ensureOwnerId$
      .pipe(
        switchMap(ownerId => this.animalsSvc.getForOwner(ownerId)),
        map((animals) => {
          // normalizacja vetId -> string
          this.myAnimals = (animals || []).map(a => {
            const any = a as any;
            const normVetId = any?.vetId != null ? String(any.vetId) : undefined;
            return { ...a, vetId: normVetId };
          });

          // 1) zbuduj grupy TYLKO na podstawie zwierzaków (bez czekania na wetów)
          const mapByVet = new Map<string, (Animal & { vetId?: string })[]>();
          for (const a of this.myAnimals) {
            if (!a.vetId) continue;
            if (!mapByVet.has(a.vetId)) mapByVet.set(a.vetId, []);
            mapByVet.get(a.vetId)!.push(a);
          }

          this.myVetGroups = Array.from(mapByVet.entries()).map(([vetId, animals]) => ({
            vetId,
            animals
          }));

          // zachowaj listę vetId (do badge'y w katalogu)
          this.myVetIds = this.myVetGroups.map(g => g.vetId);

          // 2) dociągnij dane wetów — ale to już „nadpisanie” w miejscu (bez filtrowania grup)
          return this.myVetIds;
        }),
        switchMap(vetIds => {
          if (!vetIds.length) return of([] as VetLite[]);
          return forkJoin(
            vetIds.map(id =>
              this.vetsSvc.getVetById(id).pipe(catchError(() => of(null)))
            )
          ).pipe(
            map(arr => (arr.filter(Boolean) as any[]).map(v => ({
              _id: String(v._id),
              clinicName: v.clinicName,
              email: v.email,
              phone: v.phone,
              about: v.about,
              address: v.address,
              specialties: v.specialties || []
            }) as VetLite))
          );
        })
      )
      .subscribe({
        next: (vets) => {
          // podłącz dane weta do istniejących grup (NIE USUWAJ GRUP!)
          const vetMap = new Map(vets.map(v => [v._id, v]));
          this.myVetGroups = this.myVetGroups.map(g => ({
            ...g,
            vet: vetMap.get(g.vetId) // może być undefined – to OK, nadal pokazujemy grupę
          }));
          this.loadingMyVets = false;
        },
        error: () => {
          // nawet jak błąd — zostaw grupy po zwierzakach
          this.loadingMyVets = false;
        }
      });
  }

  unassign(animal: Animal) {
    if (!confirm(`Odepnąć weterynarza od ${animal.name}?`)) return;
    this.unassigning[animal._id] = true;

    this.vetsSvc.unassignAnimalFromVet(animal._id).subscribe({
      next: () => {
        // usuń zwierzaka z grup
        for (const g of this.myVetGroups) {
          g.animals = g.animals.filter(a => a._id !== animal._id);
        }
        // usuń puste grupy
        this.myVetGroups = this.myVetGroups.filter(g => g.animals.length > 0);
        // przelicz myVetIds (badge w katalogu)
        this.myVetIds = this.myVetGroups.map(g => g.vetId);
        this.unassigning[animal._id] = false;
      },
      error: (e) => {
        alert(e?.error?.error || 'Nie udało się odpiąć.');
        this.unassigning[animal._id] = false;
      }
    });
  }

  goVetProfile(vetId: string) {
    this.router.navigate(['/vet', vetId]);
  }

  /* ================= KATALOG ================= */

  private loadCatalog() {
    this.loading = true;
    this.vetsSvc.listVets().subscribe({
      next: (res: any[]) => {
        this.vets = (res || []).map(v => ({
          _id: String(v._id),
          clinicName: v.clinicName,
          email: v.email,
          phone: v.phone,
          about: v.about,
          address: v.address,
          specialties: v.specialties || []
        }));
        this.loading = false;
      },
      error: () => { this.error = 'Nie udało się pobrać listy wetów.'; this.loading = false; }
    });
  }

  private loadMyAnimalsForSelect() {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) {
      this.auth.fetchMe().subscribe({
        next: () => this.fetchAnimalsAfterOwner(),
        error: () => {}
      });
    } else {
      this.fetchAnimalsAfterOwner();
    }
  }

  private fetchAnimalsAfterOwner() {
    const ownerId = this.auth.getOwnerId();
    if (!ownerId) return;
    this.animalsSvc.getForOwner(ownerId).subscribe({
      next: (res) => {
        this.myAnimals = (res || []).map(a => {
          const any = a as any;
          const normVetId = any?.vetId != null ? String(any.vetId) : undefined;
          return { ...a, vetId: normVetId };
        });
      },
      error: () => {}
    });
  }

  /* ================= Helpers ================= */

  filtered(): VetLite[] {
    const q = this.search.toLowerCase().trim();
    if (!q) return this.vets;
    return this.vets.filter(v =>
      [
        v.clinicName || '',
        v.address?.city || '',
        (v.specialties || []).join(' '),
        v.about || '',
        v.email || '',
        v.phone || ''
      ].join(' ').toLowerCase().includes(q)
    );
  }

  canAssign(): boolean {
    return !!(this.animalIdFromQuery || this.selectedAnimalId);
  }

  isAlreadyMyVet(vetId: string): boolean {
    return this.myVetIds.includes(vetId);
  }

  assign(vetId: string) {
    const animalId = this.animalIdFromQuery || this.selectedAnimalId;
    if (!animalId) { alert('Najpierw wybierz zwierzaka.'); return; }

    this.assigning[vetId] = true;
    this.vetsSvc.assignAnimalToVet(animalId, vetId).subscribe({
      next: () => {
        this.assigning[vetId] = false;
        alert('Przypisano weterynarza do zwierzaka.');
        // odśwież MOJĄ SEKCJĘ (zbuduje grupy po zwierzakach i dociągnie detale)
        this.loadMySection();
      },
      error: (e) => {
        this.assigning[vetId] = false;
        alert(e?.error?.error || 'Nie udało się przypisać.');
      }
    });
  }

  trackVet = (_: number, g: MyVetGroup) => g.vetId;
  trackAnimal = (_: number, a: Animal) => a._id;
}
