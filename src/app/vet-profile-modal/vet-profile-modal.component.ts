import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { VetService, VetProfile } from '../services/vet.service';
import { Animal } from '../services/animals.service';

@Component({
  selector: 'app-vet-profile-modal',
  templateUrl: './vet-profile-modal.component.html',
  styleUrls: ['./vet-profile-modal.component.scss']
})
export class VetProfileModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() vetId!: string;
  @Input() myAnimals: Animal[] = [];
  @Input() lockedAnimalId?: string;
  @Input() preselectedAnimalId?: string;

  @Output() close = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<{ vetId: string; animalId: string }>();

  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  vet: VetProfile | null = null;
  selectedAnimalId?: string;

  readonly days = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

  constructor(private vetSvc: VetService) {}

  ngOnInit(): void {
    document.body.classList.add('modal-open');
    // jeśli nie jest zablokowany – wstępny wybór (jeśli podany)
    if (!this.lockedAnimalId && this.preselectedAnimalId) {
      this.selectedAnimalId = this.preselectedAnimalId;
    }
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Gdy podmieni się lista zwierzaków – auto-preselect:
    // 1) jeśli mamy preselectedAnimalId w liście
    // 2) albo jeśli jest dokładnie jeden zwierzak
    if (!this.lockedAnimalId && !this.selectedAnimalId) {
      if (this.preselectedAnimalId && this.myAnimals?.some(a => a._id === this.preselectedAnimalId)) {
        this.selectedAnimalId = this.preselectedAnimalId;
      } else if (this.myAnimals?.length === 1) {
        this.selectedAnimalId = this.myAnimals[0]._id;
      }
    }
  }

  ngOnDestroy(): void {
    document.body.classList.remove('modal-open');
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.vetSvc.getVetById(this.vetId).subscribe({
      next: (v: VetProfile) => { this.vet = v; this.loading = false; },
      error: () => { this.error = 'Nie udało się pobrać profilu weterynarza.'; this.loading = false; }
    });
  }

  onClose(): void { this.close.emit(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.onClose(); }

  canAssign(): boolean {
    const targetId = this.lockedAnimalId ?? this.selectedAnimalId;
    return !!targetId && !this.saving;
  }

  doAssign(): void {
    const animalId = this.lockedAnimalId ?? this.selectedAnimalId;
    if (!animalId) return;
    this.saving = true;
    this.okMsg = '';
    this.error = '';

    this.vetSvc.assignAnimalToVet(animalId, this.vetId).subscribe({
      next: () => {
        this.saving = false;
        this.okMsg = 'Przypisano weterynarza.';
        this.assigned.emit({ vetId: this.vetId, animalId });
        this.onClose();
      },
      error: (e: any) => {
        this.saving = false;
        this.error = e?.error?.error || 'Nie udało się przypisać.';
      }
    });
  }

  join(arr?: string[] | null, sep = ', '): string {
    return Array.isArray(arr) && arr.length ? arr.join(sep) : '—';
  }

  get lockedAnimalLabel(): string | null {
    if (!this.lockedAnimalId) return null;
    const a = this.myAnimals?.find(x => x._id === this.lockedAnimalId);
    return a ? `${a.name} (${a.species})` : 'wybrany zwierzak';
    }
}
