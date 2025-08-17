import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core';
import Chart from 'chart.js/auto';

export interface StoolTest {
  date: string;
  consistency: 'solid' | 'soft' | 'watery';
  color: string;
  blood: boolean;
  mucus: boolean;
}

@Component({
  selector: 'app-stool-tab',
  templateUrl: './stool-tab.component.html',
  styleUrls: ['./stool-tab.component.scss']
})
export class StoolTabComponent implements OnChanges {
  @Input() stoolTests: StoolTest[] = [];
  @ViewChild('stoolChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges(): void {
    if (this.stoolTests && this.stoolTests.length > 0) {
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

    const labels = this.stoolTests.map(t => t.date);
    const bloodCases = this.stoolTests.map(t => (t.blood ? 1 : 0));
    const mucusCases = this.stoolTests.map(t => (t.mucus ? 1 : 0));

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Krew',
            data: bloodCases,
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
          },
          {
            label: 'Śluz',
            data: mucusCases,
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
