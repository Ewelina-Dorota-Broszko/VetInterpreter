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

type RefRanges = Record<string, { min: number; max: number; unit: string }>;

@Component({
  selector: 'app-blood-tab',
  templateUrl: './blood-tab.component.html',
  styleUrls: ['./blood-tab.component.scss']
})
export class BloodTabComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() bloodTests: BloodTest[] = [];
  @Input() referenceRanges!: RefRanges;
  @Input() active = false;

  @ViewChild('bloodChartCanvas') bloodChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  // ===== Grupy parametrów =====
  morphologyParams = [
    { key: 'hemoglobin', label: 'HGB' },
    { key: 'rbc', label: 'RBC' },
    { key: 'wbc', label: 'WBC' },
    { key: 'hematocrit', label: 'HCT' },
    { key: 'platelets', label: 'PLT' },
    { key: 'mcv', label: 'MCV' },
    { key: 'mch', label: 'MCH' },
    { key: 'mchc', label: 'MCHC' },
  ];

  biochemParams = [
    { key: 'glucose', label: 'Glukoza' },
    { key: 'urea', label: 'Mocznik (BUN)' },
    { key: 'creatinine', label: 'Kreatynina' },
    { key: 'alt', label: 'ALT (GPT)' },
    { key: 'ast', label: 'AST (GOT)' },
    { key: 'alp', label: 'ALP' },
    { key: 'albumin', label: 'Albumina' },
    { key: 'totalProtein', label: 'Białko całkowite' },
    { key: 'globulin', label: 'Globuliny' },
  ];

  // === wykres ===
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
    if (!this.active || !this.bloodTests?.length || !this.bloodChartCanvas) {
      this.destroyChart();
      return;
    }

    const ctx = this.bloodChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart();
    const labels = this.bloodTests.map(t => t.date);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'HGB (g/dL)', data: this.bloodTests.map(t => t.hemoglobin ?? null), borderColor: '#4e87f0', fill: false, tension: 0.3 },
          { label: 'WBC (10⁹/L)', data: this.bloodTests.map(t => t.wbc ?? null), borderColor: '#1cc88a', fill: false, tension: 0.3 },
          { label: 'Glukoza (mg/dL)', data: this.bloodTests.map(t => t.glucose ?? null), borderColor: '#f6c23e', fill: false, tension: 0.3 },
          { label: 'Kreatynina (mg/dL)', data: this.bloodTests.map(t => t.creatinine ?? null), borderColor: '#e74a3b', fill: false, tension: 0.3 },
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
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  // ===== Pomocnicze =====
  getValue(test: BloodTest, key: string): number | undefined {
    return (test as any)[key];
  }

  getRangeText(param: keyof RefRanges): string {
    const r = this.referenceRanges?.[param];
    if (!r) return '';
    return `(${r.min}–${r.max} ${r.unit})`;
  }

  getValueStatus(value: number | undefined, param: keyof RefRanges): 'low' | 'normal' | 'high' {
    if (value == null) return 'normal';
    const r = this.referenceRanges?.[param];
    if (!r) return 'normal';
    if (value < r.min) return 'low';
    if (value > r.max) return 'high';
    return 'normal';
  }

 getBarStyle(value: number | undefined, key: string) {
  const range = this.referenceRanges?.[key];
  if (!range || value == null) return { width: '0%' };

  const min = range.min;
  const max = range.max;

  // Obliczamy procent pozycji wartości względem zakresu
  let percent = ((value - min) / (max - min)) * 100;

  // Jeśli wynik poniżej minimum — ustaw minimalny pasek 3%
  if (value < min) percent = 1;
  // Jeśli wynik powyżej maksimum — ustaw maksymalnie 100%
  if (value > max) percent = 100;
  // Zabezpieczenie zakresu
  percent = Math.min(100, Math.max(percent, 1));

  // Kolory
  let color = '#1cc88a'; // zielony (normal)
  if (value < min) color = '#4dabf7'; // niebieski (niski)
  if (value > max) color = '#f6c23e'; // żółty (wysoki)

  return { width: `${percent}%`, background: color };
}
}
