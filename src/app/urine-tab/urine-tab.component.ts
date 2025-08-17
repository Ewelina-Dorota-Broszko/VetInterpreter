import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

export interface UrineTest {
  date: string;
  color: string;
  specificGravity: number;
  pH: number;
  protein: string;
  glucose: string;
  ketones: string;
}

@Component({
  selector: 'app-urine-tab',
  templateUrl: './urine-tab.component.html',
  styleUrls: ['./urine-tab.component.scss']
})
export class UrineTabComponent implements OnChanges {
  @Input() urineTests: UrineTest[] = [];
  @ViewChild('urineChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(): void {
    if (this.urineTests && this.urineTests.length > 0) {
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

    const labels = this.urineTests.map(t => t.date);
    const pHvalues = this.urineTests.map(t => t.pH);
    const sgValues = this.urineTests.map(t => t.specificGravity);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'pH',
            data: pHvalues,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'SG (Specific Gravity)',
            data: sgValues,
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            stacked: false,  // ← teraz tutaj
            title: { display: true, text: 'pH' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            stacked: false,  // ← i tutaj
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'SG' }
          }
        }
      }
    });
    
  }

  trackByIndex(i: number) { return i; }
}
