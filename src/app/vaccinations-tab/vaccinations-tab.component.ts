import { Component, Input, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';

export interface Vaccination {
  _id?: string;
  type: string;      // np. 'rabies', 'dhpp', ...
  date: string;      // YYYY-MM-DD (wykonano)
  dueDate?: string;  // YYYY-MM-DD (następny termin)
  product?: string;
  batch?: string;
  vet?: string;
  notes?: string;
}

@Component({
  selector: 'app-vaccinations-tab',
  templateUrl: './vaccinations-tab.component.html',
  styleUrls: ['./vaccinations-tab.component.scss']
})
export class VaccinationsTabComponent implements OnChanges, AfterViewInit {
  @Input() vaccinations: Vaccination[] = [];
  @ViewChild('vaccChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  /** nowsze → starsze po dacie wykonania */
  get sorted(): Vaccination[] {
    return [...(this.vaccinations || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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

    const labels = this.sorted.map(v => `${this.prettyType(v.type)} • ${v.date}`);

    // Dni do terminu: <0 po terminie, 0 dziś, >0 w przyszłości, null => NaN
    const daysToDue = this.sorted.map(v => this.daysUntil(v.dueDate));
    const data = daysToDue.map(d => (d === null ? NaN : d));

    const pointColors = daysToDue.map(d => {
      if (d === null) return 'rgba(107,114,128,1)'; // brak terminu – szary
      if (d < 0)      return 'rgba(220,53,69,1)';   // po terminie – czerwony
      if (d <= 30)    return 'rgba(255,193,7,1)';   // wkrótce – żółty
      return 'rgba(40,167,69,1)';                   // OK – zielony
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Dziś (0 dni)',
            data: data.map(() => 0),
            borderColor: 'rgba(0,0,0,0.25)',
            borderDash: [6, 6],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Dni do terminu (dueDate)',
            data,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.15)',
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
              label: (ctx) => Number.isNaN(ctx.parsed.y) ? 'Brak terminu' : `Dni do terminu: ${ctx.parsed.y}`,
              afterBody: (items) => {
                const i = items?.[0]?.dataIndex ?? 0;
                const v = this.sorted[i];
                const extra: string[] = [];
                if (v.dueDate) extra.push(`Następny termin: ${v.dueDate}`);
                if (v.product) extra.push(`Produkt: ${v.product}`);
                if (v.batch) extra.push(`Seria: ${v.batch}`);
                if (v.vet) extra.push(`Lekarz: ${v.vet}`);
                if (v.notes) extra.push(`Uwagi: ${v.notes}`);
                return extra;
              }
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Dni do kolejnego terminu' },
            suggestedMin: -30,
            suggestedMax: 180
          }
        }
      }
    });
  }

  private daysUntil(dateStr?: string): number | null {
    if (!dateStr) return null;
    const today = new Date();
    const todayMid = new Date(today.toDateString());
    const due = new Date(dateStr + 'T00:00:00');
    const diffMs = +due - +todayMid;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  prettyType(t: string): string {
    switch (t) {
      case 'rabies': return 'Wścieklizna';
      case 'dhpp': return 'DHP/DHPP';
      case 'lepto': return 'Leptospiroza';
      case 'bord': return 'Bordetella';
      case 'lyme': return 'Borelioza';
      case 'influenza': return 'Grypa psów (CIV)';
      case 'fvrcp': return 'FVRCP';
      case 'felv': return 'FeLV';
      case 'fiv': return 'FIV';
      case 'chlamydia': return 'Chlamydioza';
      default: return t || '—';
    }
  }

  trackByIndex(i: number) { return i; }
}
