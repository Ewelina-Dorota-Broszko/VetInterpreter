import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

export interface DiabetesLog {
  date: string;                     // YYYY-MM-DD
  time: string;                     // HH:mm
  glucose: number;                  // mg/dL
  measurementType: 'fasting' | 'postMeal' | 'random';
  insulinType?: string;
  insulinDose?: number;
  comments?: string;

  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-diabetes-tab',
  templateUrl: './diabetes-tab.component.html',
  styleUrls: ['./diabetes-tab.component.scss']
})
export class DiabetesTabComponent implements OnChanges, AfterViewInit {
  @Input() diabetesLogs: DiabetesLog[] = [];
  @ViewChild('diabetesChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /** sortowanie nowsze → starsze */
  get sorted(): DiabetesLog[] {
    return [...(this.diabetesLogs || [])].sort((a, b) => {
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

  /** przypisanie kolorów do rodzaju pomiaru */
  private colorFor(type: DiabetesLog['measurementType']): string {
    switch (type) {
      case 'fasting': return 'rgba(54, 162, 235, 1)';   // niebieski
      case 'postMeal': return 'rgba(255, 159, 64, 1)';  // pomarańczowy
      case 'random': return 'rgba(153, 102, 255, 1)';   // fioletowy
      default: return 'rgba(75, 192, 192, 1)';          // zielonkawy
    }
  }

  private renderChart(): void {
    const ctx = this.chartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;

    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const labels = this.sorted.map(d => `${d.date} ${d.time}`);
    const values = this.sorted.map(d => d.glucose);
    const pointColors = this.sorted.map(d => this.colorFor(d.measurementType));

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
            pointRadius: 5,
            pointHoverRadius: 7,
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
              afterBody: (items) => {
                const i = items?.[0]?.dataIndex ?? 0;
                const row = this.sorted[i];
                const extra: string[] = [];
                if (row?.measurementType) {
                  const typeLabel =
                    row.measurementType === 'fasting' ? 'Na czczo' :
                    row.measurementType === 'postMeal' ? 'Po posiłku' :
                    'Przypadkowy';
                  extra.push(`Rodzaj pomiaru: ${typeLabel}`);
                }
                if (row?.insulinType) extra.push(`Insulina: ${row.insulinType}`);
                if (row?.insulinDose != null) extra.push(`Dawka: ${row.insulinDose} j.`);
                if (row?.comments) extra.push(`Uwagi: ${row.comments}`);
                return extra;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'mg/dL' },
            suggestedMin: 60,
            suggestedMax: 250
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
