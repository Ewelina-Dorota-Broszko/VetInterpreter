import {
  Component, Input, OnChanges, OnDestroy, SimpleChanges, AfterViewInit, ElementRef, ViewChild
} from '@angular/core';
import Chart from 'chart.js/auto';

export interface BloodTest {
  date: string;
  hemoglobin?: number;
  rbc?: number;
  wbc?: number;
  hematocrit?: number;
  platelets?: number;
  mcv?: number;
  mch?: number;
  mchc?: number;
  glucose?: number;
  urea?: number;
  creatinine?: number;
  alt?: number;
  ast?: number;
  alp?: number;
  totalProtein?: number;
  albumin?: number;
  globulin?: number;
  bilirubinTotal?: number;
  bilirubinDirect?: number;
  bilirubinIndirect?: number;
  comments?: string;
}

type RefRanges = Record<string, {min:number; max:number; unit:string}>;

@Component({
  selector: 'app-blood-tab',
  templateUrl: './blood-tab.component.html',
  styleUrls: ['./blood-tab.component.scss']
})
export class BloodTabComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() bloodTests: BloodTest[] = [];
  @Input() referenceRanges!: RefRanges;
  /** Czy zakładka jest aktualnie widoczna (aktywowana przez rodzica) */
  @Input() active = false;

  @ViewChild('bloodChartCanvas') bloodChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  
  ngAfterViewInit(): void {
    this.maybeRenderChart();
    setTimeout(() => this.maybeRenderChart());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bloodTests'] || changes['active']) {
      this.maybeRenderChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private maybeRenderChart() {
    // rysuj tylko, gdy zakładka jest aktywna i jest gdzie rysować
    if (!this.active) { this.destroyChart(); return; }
    if (!this.bloodTests?.length) { this.destroyChart(); return; }
    if (!this.bloodChartCanvas) return;

    const ctx = this.bloodChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart();

    const labels = this.bloodTests.map(t => t.date);
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'HGB (g/dL)', data: this.bloodTests.map(t => t.hemoglobin ?? null), fill: false, tension: 0.3 },
          { label: 'WBC (10⁹/L)', data: this.bloodTests.map(t => t.wbc ?? null),       fill: false, tension: 0.3 },
          { label: 'Glukoza (mg/dL)', data: this.bloodTests.map(t => t.glucose ?? null), fill: false, tension: 0.3 },
          { label: 'Kreatynina (mg/dL)', data: this.bloodTests.map(t => t.creatinine ?? null), fill: false, tension: 0.3 },
          { label: 'ALT (U/L)', data: this.bloodTests.map(t => t.alt ?? null),           fill: false, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Trendy parametrów krwi' } },
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: false } }
      }
    });
  }

  private destroyChart() {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
  }

  // ===== helpers do tabeli =====
  getRangeText(param: keyof RefRanges): string {
    const r = this.referenceRanges?.[param];
    if (!r) return '';
    return `(${r.min}–${r.max} ${r.unit})`;
  }

  getValueStatus(value: number | undefined, param: keyof RefRanges): 'low'|'normal'|'high' {
    if (value == null) return 'normal';
    const r = this.referenceRanges?.[param];
    if (!r) return 'normal';
    if (value < r.min) return 'low';
    if (value > r.max) return 'high';
    return 'normal';
  }

  trackByIndex(i: number) { return i; }
}
