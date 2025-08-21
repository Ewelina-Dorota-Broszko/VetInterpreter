import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

export interface SymptomLog {
  _id?: string;
  date: string;               // YYYY-MM-DD
  symptomTags?: string[];     // np. ["kaszel", "apatia"]
  painScore?: number;         // 0–10
  energy?: number;            // 0–10
  appetite?: number;          // 0–10
  notes?: string;
}

@Component({
  selector: 'app-symptoms-tab',
  templateUrl: './symptoms-tab.component.html',
  styleUrls: ['./symptoms-tab.component.scss']
})
export class SymptomsTabComponent implements OnChanges, AfterViewInit {
  @Input() symptoms: SymptomLog[] = [];
  @ViewChild('symptomsChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /** Sortowanie nowsze → starsze */
  get sorted(): SymptomLog[] {
    return [...(this.symptoms || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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

    const labels = this.sorted.map(s => s.date);
    const pain = this.sorted.map(s => s.painScore ?? null);
    const energy = this.sorted.map(s => s.energy ?? null);
    const appetite = this.sorted.map(s => s.appetite ?? null);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ból (0–10)',
            data: pain,
            borderColor: 'rgba(255,99,132,1)',
            backgroundColor: 'rgba(255,99,132,0.2)',
            tension: 0.3,
            pointRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Energia (0–10)',
            data: energy,
            borderColor: 'rgba(54,162,235,1)',
            backgroundColor: 'rgba(54,162,235,0.2)',
            tension: 0.3,
            pointRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Apetyt (0–10)',
            data: appetite,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            tension: 0.3,
            pointRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            min: 0,
            max: 10,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Skala 0–10' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const i = items[0].dataIndex;
                const s = this.sorted[i];
                const tags = s.symptomTags?.length ? `Objawy: ${s.symptomTags.join(', ')}` : '';
                const notes = s.notes ? `Uwagi: ${s.notes}` : '';
                return [tags, notes].filter(Boolean);
              }
            }
          }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
}
