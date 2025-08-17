import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

export interface WeightEntry {
  date: string;
  weightKg: number;
  bcs?: number; // Body Condition Score (1–9)
  note?: string;
}

@Component({
  selector: 'app-weight-tab',
  templateUrl: './weight-tab.component.html',
  styleUrls: ['./weight-tab.component.scss']
})
export class WeightTabComponent implements OnChanges {
  @Input() weightHistory: WeightEntry[] = [];
  @ViewChild('weightChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(): void {
    if (this.weightHistory && this.weightHistory.length > 0) {
      this.renderChart();
    }
  }

  private renderChart(): void {
    if (!this.chartRef) return;
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.weightHistory.map(w => w.date);
    const weights = this.weightHistory.map(w => w.weightKg);
    const bcsValues = this.weightHistory.map(w => w.bcs ?? null);

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
            tension: 0.3
          },
          {
            label: 'BCS',
            data: bcsValues,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            yAxisID: 'y2',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
       
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
