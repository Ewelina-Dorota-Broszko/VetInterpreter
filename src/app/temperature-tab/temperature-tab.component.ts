import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

export interface TemperatureLog {
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  temperature: number;
  behavior?: 'normal' | 'lethargic' | 'agitated' | 'unresponsive' | '';
  appetite?: 'normal' | 'reduced' | 'none' | '';
  comments?: string;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-temperature-tab',
  templateUrl: './temperature-tab.component.html',
  styleUrls: ['./temperature-tab.component.scss']
})
export class TemperatureTabComponent implements OnChanges, AfterViewInit {
  @Input() temperatureLogs: TemperatureLog[] = [];
  @Input() species: 'dog' | 'cat' = 'dog'; // opcjonalnie – różne zakresy
  @ViewChild('temperatureChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /** Posortowane wpisy (nowsze → starsze) */
  get sorted(): TemperatureLog[] {
    return [...(this.temperatureLogs || [])].sort((a, b) => {
      const adt = `${a.date ?? ''} ${a.time ?? ''}`;
      const bdt = `${b.date ?? ''} ${b.time ?? ''}`;
      return bdt.localeCompare(adt);
    });
  }

  ngAfterViewInit(): void {
    if (this.sorted.length) this.renderChart();
  }

  ngOnChanges(): void {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if (this.sorted.length && this.chartRef) this.renderChart();
  }

  private thresholds() {
    // orientacyjne zakresy referencyjne (°C)
    return this.species === 'cat'
      ? { low: 37.5, normalMin: 38.1, normalMax: 39.2, high: 39.5 }
      : { low: 37.3, normalMin: 38.0, normalMax: 39.2, high: 39.5 }; // dog (domyślnie)
  }

  private pointColorFor(temp: number | null | undefined): string {
    if (temp == null || Number.isNaN(temp)) return 'rgba(160,160,160,1)'; // brak
    const t = this.thresholds();
    if (temp < t.low) return 'rgba(100,100,255,1)';          // hipotermia – niebieskawy
    if (temp > t.high) return 'rgba(200,0,0,1)';             // wysoka gorączka – czerwony
    if (temp > t.normalMax) return 'rgba(255,159,64,1)';     // podwyższona – pomarańcz
    return 'rgba(75,192,192,1)';                             // w normie – zielonkawy
  }

  private renderChart(): void {
    const ctx = this.chartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (this.chart) { this.chart.destroy(); this.chart = null; }

    // dane
    const labels = this.sorted.map(t => `${t.date} ${t.time}`);
    const values = this.sorted.map(t => (typeof t.temperature === 'number' ? t.temperature : NaN));
    const pointColors = this.sorted.map(t => this.pointColorFor(t.temperature));

    const t = this.thresholds();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          // linie pomocnicze (granice norm) jako „ukryte” punkty z linią
          {
            label: 'Górna granica normy',
            data: values.map(() => t.normalMax),
            borderColor: 'rgba(0,0,0,0.15)',
            borderDash: [6, 6],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Dolna granica normy',
            data: values.map(() => t.normalMin),
            borderColor: 'rgba(0,0,0,0.15)',
            borderDash: [6, 6],
            pointRadius: 0,
            fill: false
          },
          // właściwa seria temperatur
          {
            label: 'Temperatura (°C)',
            data: values,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.15)',
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              // rozszerzony tooltip
              afterBody: (items) => {
                const i = items?.[0]?.dataIndex ?? 0;
                const row = this.sorted[i];
                const extra: string[] = [];
                if (row?.behavior) extra.push(`Zachowanie: ${this.prettyBehavior(row.behavior)}`);
                if (row?.appetite) extra.push(`Apetyt: ${this.prettyAppetite(row.appetite)}`);
                if (row?.comments) extra.push(`Uwagi: ${row.comments}`);
                return extra;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: '°C' },
            suggestedMin: 36.5,
            suggestedMax: 41.0
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }

  prettyBehavior(b?: TemperatureLog['behavior']): string {
    switch (b) {
      case 'normal': return 'Normalne';
      case 'lethargic': return 'Ospałe';
      case 'agitated': return 'Pobudzone';
      case 'unresponsive': return 'Brak reakcji';
      default: return '—';
    }
  }

  prettyAppetite(a?: TemperatureLog['appetite']): string {
    switch (a) {
      case 'normal': return 'Normalny';
      case 'reduced': return 'Zmniejszony';
      case 'none': return 'Brak';
      default: return '—';
    }
  }
}
