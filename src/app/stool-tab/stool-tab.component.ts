import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

export interface StoolTest {
  _id?: string;
  date: string;
  consistency: 'solid' | 'soft' | 'watery';
  color: string;
  blood: boolean;
  mucus: boolean;
  odor?: string;
  parasites?: boolean;
  comments?: string;
}

@Component({
  selector: 'app-stool-tab',
  templateUrl: './stool-tab.component.html',
  styleUrls: ['./stool-tab.component.scss']
})
export class StoolTabComponent implements OnChanges, AfterViewInit {
  @Input() stoolTests: StoolTest[] = [];
  @ViewChild('stoolChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  get sorted(): StoolTest[] {
    return [...(this.stoolTests || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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

  const labels = this.sorted.map(t => t.date);

  // mapowanie na liczby
  const consistencyMap: Record<string, number> = { solid: 0, soft: 1, watery: 2 };
  const consistencyValues = this.sorted.map(t => consistencyMap[t.consistency]);

  const bloodCases = this.sorted.map(t => (t.blood ? 1 : 0));
  const mucusCases = this.sorted.map(t => (t.mucus ? 1 : 0));
  const parasiteCases = this.sorted.map(t => (t.parasites ? 1 : 0));

  this.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Konsystencja (0=stała,1=miękka,2=wodnista)',
          data: consistencyValues,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          yAxisID: 'y1',
          tension: 0.3
        },
        {
          label: 'Krew',
          data: bloodCases,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          yAxisID: 'y'
        },
        {
          label: 'Śluz',
          data: mucusCases,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          yAxisID: 'y'
        },
        {
          label: 'Pasożyty',
          data: parasiteCases,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Wartości binarne (0/1)' }
        },
        y1: {
          beginAtZero: true,
          min: 0,
          max: 2,
          ticks: {
            stepSize: 1,
            callback: (v) =>
              v === 0 ? 'Stała' : v === 1 ? 'Miękka' : 'Wodnista'
          },
          position: 'right',
          title: { display: true, text: 'Konsystencja' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              // pokaż dodatkowo kolor i zapach z testu
              const i = items[0].dataIndex;
              const t = this.sorted[i];
              return [`Kolor: ${t.color}`, `Zapach: ${t.odor || '—'}`];
            }
          }
        }
      }
    }
  });
}


  trackByIndex(i: number) { return i; }

  // pomocnicza prezentacja tekstowa konsystencji
  prettyConsistency(c: StoolTest['consistency']): string {
    return c === 'solid' ? 'Stała' : c === 'soft' ? 'Miękka' : 'Wodnista';
  }
}
