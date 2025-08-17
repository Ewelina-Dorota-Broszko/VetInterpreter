import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

export interface DiabetesLog {
  date: string;
  time: string;
  glucose: number;
  measurementType: 'fasting' | 'postMeal' | 'random';
  insulinType?: string;
  insulinDose?: number;
}

@Component({
  selector: 'app-diabetes-tab',
  templateUrl: './diabetes-tab.component.html',
  styleUrls: ['./diabetes-tab.component.scss']
})
export class DiabetesTabComponent implements OnChanges {
  @Input() diabetesLogs: DiabetesLog[] = [];
  @ViewChild('diabetesChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(): void {
    if (this.diabetesLogs && this.diabetesLogs.length > 0) {
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

    const labels = this.diabetesLogs.map(d => `${d.date} ${d.time}`);
    const values = this.diabetesLogs.map(d => d.glucose);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Glukoza (mg/dL)',
            data: values,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'mg/dL' }
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
