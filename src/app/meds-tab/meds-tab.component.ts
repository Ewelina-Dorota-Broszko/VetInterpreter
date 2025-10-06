// meds-tab.component.ts
import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import Chart from 'chart.js/auto';
import { AnimalsService } from '../services/animals.service';

export interface Medication {
  _id?: string;
  name: string;
  dose: string;
  frequency: string;        // np. „codziennie”, „2x dziennie”
  timesOfDay?: string[];    // np. ["08:00", "20:00"]
  startDate: string;        // YYYY-MM-DD
  endDate?: string | null;  // YYYY-MM-DD
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // meta (mogą nie występować dla starych rekordów)
  addedBy?: 'owner' | 'vet';
  addedByVetId?: string | null;
}

@Component({
  selector: 'app-meds-tab',
  templateUrl: './meds-tab.component.html',
  styleUrls: ['./meds-tab.component.scss']
})
export class MedsTabComponent implements OnChanges, AfterViewInit {
  @Input() animalId?: string;
  @Input() medications: Medication[] = [];
  @Output() changed = new EventEmitter<void>(); // (opcjonalnie) powiadom rodzica, że stan się zmienił
  @ViewChild('medsChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  saving = new Set<string>();

  constructor(private animals: AnimalsService) {}

  /** nowsze → starsze */
  get sorted(): Medication[] {
    return [...(this.medications || [])].sort((a, b) =>
      (b.startDate || '').localeCompare(a.startDate || '')
    );
  }

  ngAfterViewInit(): void {
    if ((this.sorted?.length ?? 0) > 0) this.renderChart();
  }

  ngOnChanges(): void {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if ((this.sorted?.length ?? 0) > 0 && this.chartRef) this.renderChart();
  }

  /** Przełącz aktywność i zapisz do backendu (PATCH) */
  onToggleActive(m: Medication) {
    const medId = m._id ?? '';
    if (!this.animalId || !medId) return;

    if (this.saving.has(medId)) return;
    const prev = m.isActive;
    m.isActive = !prev;                                // optymistycznie
    this.saving.add(medId);

    this.animals.updateMedication(this.animalId, medId, { isActive: m.isActive }).subscribe({
      next: () => {
        this.saving.delete(medId);
        this.renderChart();                            // odśwież wykres
        this.changed.emit();
      },
      error: (e) => {
        m.isActive = prev;                             // rollback
        this.saving.delete(medId);
        alert(e?.error?.error || 'Nie udało się zaktualizować statusu leku.');
      }
    });
  }

  /** Usuń lek (DELETE) */
  onDelete(m: Medication) {
    const medId = m._id ?? '';
    if (!this.animalId || !medId) return;

    const sure = confirm(`Usunąć lek "${m.name}"?`);
    if (!sure) return;

    if (this.saving.has(medId)) return;
    this.saving.add(medId);

    this.animals.deleteMedication(this.animalId, medId).subscribe({
      next: () => {
        // usuń lokalnie z listy
        this.medications = (this.medications || []).filter(x => x._id !== medId);
        this.saving.delete(medId);
        // odśwież wykres (przerysujemy z nowymi danymi)
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        if ((this.sorted?.length ?? 0) > 0 && this.chartRef) this.renderChart();
        this.changed.emit();
      },
      error: (e) => {
        this.saving.delete(medId);
        // typowy przypadek błędu dla zalogowanego weta:
        // 404 gdy próbuje usunąć lek dodany przez innego weta (backend ogranicza po addedByVetId)
        alert(e?.error?.error || 'Nie udało się usunąć leku.');
      }
    });
  }

  /** wykres: prosty rozkład aktywne/nieaktywne wg częstotliwości */
  private renderChart(): void {
    const ctx = this.chartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    // grupujemy wg frequency
    const groups: Record<string, { active: number; inactive: number }> = {};
    for (const m of this.sorted) {
      const key = m.frequency || 'inne';
      if (!groups[key]) groups[key] = { active: 0, inactive: 0 };
      if (m.isActive) groups[key].active++;
      else groups[key].inactive++;
    }

    const labels = Object.keys(groups);
    const activeCounts = labels.map(l => groups[l].active);
    const inactiveCounts = labels.map(l => groups[l].inactive);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Aktywne',
            data: activeCounts,
            backgroundColor: 'rgba(40,167,69,0.7)'
          },
          {
            label: 'Nieaktywne',
            data: inactiveCounts,
            backgroundColor: 'rgba(220,53,69,0.6)'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Rozkład leków wg częstotliwości' },
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, stepSize: 1 },
            title: { display: true, text: 'Liczba leków' }
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
