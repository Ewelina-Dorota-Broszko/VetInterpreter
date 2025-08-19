import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

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
}

@Component({
  selector: 'app-meds-tab',
  templateUrl: './meds-tab.component.html',
  styleUrls: ['./meds-tab.component.scss']
})
export class MedsTabComponent implements OnChanges, AfterViewInit {
  @Input() medications: Medication[] = [];
  @ViewChild('medsChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /** Sortowanie po dacie startu (nowsze → starsze) */
  get sorted(): Medication[] {
    return [...(this.medications || [])].sort((a, b) =>
      (b.startDate || '').localeCompare(a.startDate || '')
    );
  }

  ngAfterViewInit(): void {
    if (this.sorted.length) this.renderChart();
  }

  ngOnChanges(): void {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if (this.sorted.length && this.chartRef) this.renderChart();
  }

  private renderChart(): void {
    const ctx = this.chartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const labels = this.sorted.map(m => m.name);
    const activeFlags = this.sorted.map(m => (m.isActive ? 1 : 0));

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Aktywna terapia (0 = nie, 1 = tak)',
            data: activeFlags,
            backgroundColor: activeFlags.map(a =>
              a ? 'rgba(40,167,69,0.7)' : 'rgba(220,53,69,0.6)'
            )
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 1,
              callback: (v) => v === 0 ? 'Nie' : 'Tak'
            },
            title: { display: true, text: 'Status' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const m = this.sorted[i];
                const extra: string[] = [];
                extra.push(`Dawka: ${m.dose}`);
                extra.push(`Częstotliwość: ${m.frequency}`);
                if (m.timesOfDay?.length) extra.push(`Godziny: ${m.timesOfDay.join(', ')}`);
                if (m.startDate) extra.push(`Start: ${m.startDate}`);
                if (m.endDate) extra.push(`Koniec: ${m.endDate}`);
                if (m.notes) extra.push(`Uwagi: ${m.notes}`);
                return extra;
              }
            }
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
