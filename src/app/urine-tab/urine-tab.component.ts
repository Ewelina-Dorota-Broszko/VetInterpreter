import { Component, Input, OnChanges, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import Chart from 'chart.js/auto';

export interface UrineTest {
  _id?: string;
  date: string;
  color?: string;
  clarity?: string;
  specificGravity?: number | string;
  pH?: number | string;
  protein?: string;
  glucose?: string;
  ketones?: string;
  bilirubin?: string;
  urobilinogen?: string;
  blood?: string;
  nitrites?: string;
  leukocyteEsterase?: string;
  wbc?: string; rbc?: string; epithelialCells?: string; crystals?: string;
  casts?: string; bacteria?: string; yeast?: string; sperm?: string;
  mucus?: string; parasites?: string;
  comments?: string;
  physicalChemical?: Partial<UrineTest>;
  microscopic?: Partial<UrineTest>;
}

@Component({
  selector: 'app-urine-tab',
  templateUrl: './urine-tab.component.html',
  styleUrls: ['./urine-tab.component.scss']
})
export class UrineTabComponent implements OnChanges {
  @Input() urineTests: UrineTest[] = [];
  @Input() species: 'dog' | 'cat' = 'dog';
  @ViewChild('urineChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  expanded = new Set<string>();

  ngAfterViewInit(): void {
      this.renderChart();
    }

  /** To jest już spłaszczona lista, bez zagnieżdżeń */
  viewTests: Array<UrineTest & { specificGravity?: number; pH?: number }> = [];

  private ranges = {
    dog: { sg: { min: 1.015, max: 1.045 }, ph: { min: 5.5, max: 7.5 } },
    cat: { sg: { min: 1.035, max: 1.060 }, ph: { min: 6.0, max: 7.5 } },
  } as const;

  ngOnChanges(changes: SimpleChanges): void {
    // sort + spłaszczenie + bezpieczne number
    const sorted = [...(this.urineTests || [])].sort((a,b) => (b.date||'').localeCompare(a.date||''));
    this.viewTests = sorted.map(t => {
      const flat = { ...t, ...t.physicalChemical, ...t.microscopic };
      return {
        ...flat,
        specificGravity: this.num(flat.specificGravity),
        pH: this.num(flat.pH),
      };
    });

    if (this.viewTests.length) this.renderChart();
    else this.destroyChart();
    if (changes['urineTests'] || changes['active']) {
         this.renderChart();
      }
  }

  private num(v: unknown): number | undefined {
    if (typeof v === 'number') return v;
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  }

  private destroyChart() { if (this.chart) { this.chart.destroy(); this.chart = null; } }

  private renderChart(): void {
    const ctx = this.chartRef?.nativeElement?.getContext('2d');
    if (!ctx) return;
    this.destroyChart();

    const labels = this.viewTests.map(t => t.date);
    const pHvalues = this.viewTests.map(t => t.pH ?? NaN);
    const sgValues = this.viewTests.map(t => t.specificGravity ?? NaN);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'pH', data: pHvalues, borderColor: 'rgba(54,162,235,1)', backgroundColor: 'rgba(54,162,235,.2)', tension: .3, yAxisID: 'y' },
          { label: 'SG (Specific Gravity)', data: sgValues, borderColor: 'rgba(255,206,86,1)', backgroundColor: 'rgba(255,206,86,.2)', tension: .3, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y:  { type: 'linear', position: 'left',  title: { display: true, text: 'pH' }, suggestedMin: 4.5, suggestedMax: 9.5 },
          y1: { type: 'linear', position: 'right', title: { display: true, text: 'SG' }, suggestedMin: 1.0, suggestedMax: 1.08, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  trackByIndex(i: number) { return i; }
  toggle(t: UrineTest) { const id = t._id ?? `${t.date}-${t.color ?? ''}`; this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id); }
  isExpanded(t: UrineTest) { const id = t._id ?? `${t.date}-${t.color ?? ''}`; return this.expanded.has(id); }

  outPh(v?: number): boolean { if (v == null) return false; const r = this.ranges[this.species].ph; return v < r.min || v > r.max; }
  outSg(v?: number): boolean { if (v == null) return false; const r = this.ranges[this.species].sg; return v < r.min || v > r.max; }
}
