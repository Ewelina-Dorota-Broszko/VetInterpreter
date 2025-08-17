import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

export interface TemperatureLog {
  date: string;
  time: string;
  temperature: number;
}

@Component({
  selector: 'app-temperature-tab',
  templateUrl: './temperature-tab.component.html',
  styleUrls: ['./temperature-tab.component.scss']
})
export class TemperatureTabComponent implements OnChanges {
  @Input() temperatureLogs: TemperatureLog[] = [];
  @ViewChild('temperatureChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(): void {
    if (this.temperatureLogs && this.temperatureLogs.length > 0) {
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

    const labels = this.temperatureLogs.map(t => `${t.date} ${t.time}`);
    const values = this.temperatureLogs.map(t => t.temperature);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: values,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
            title: { display: true, text: '°C' }
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
