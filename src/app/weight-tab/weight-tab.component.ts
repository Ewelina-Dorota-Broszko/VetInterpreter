import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

export interface WeightEntry {
  date: string;       // YYYY-MM-DD
  weightKg: number;
  bcs?: number;       // Body Condition Score (1–9)
  note?: string;      // dodatkowe uwagi
}

@Component({
  selector: 'app-weight-tab',
  templateUrl: './weight-tab.component.html',
  styleUrls: ['./weight-tab.component.scss']
})
export class WeightTabComponent implements OnChanges, AfterViewInit {
  @Input() weightHistory: WeightEntry[] = [];
  @ViewChild('weightChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /** Sortowanie nowsze → starsze */
  get sorted(): WeightEntry[] {
    return [...(this.weightHistory || [])].sort((a, b) => {
      return (b.date || '').localeCompare(a.date || '');
    });
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

    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const labels = this.sorted.map(w => w.date);
    const weights = this.sorted.map(w => w.weightKg);
    const bcsValues = this.sorted.map(w => w.bcs ?? null);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Waga (kg)',
            data: weights,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            yAxisID: 'y1',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'BCS',
            data: bcsValues,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            yAxisID: 'y2',
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const i = items?.[0]?.dataIndex ?? 0;
                const row = this.sorted[i];
                return row?.note ? [`Uwagi: ${row.note}`] : [];
              }
            }
          }
        },
        scales: {
          y1: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Waga (kg)' },
            stacked: false,
          },
          y2: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'BCS (1–9)' },
            min: 1,
            max: 9,
            grid: { drawOnChartArea: false },
            stacked: false,
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
