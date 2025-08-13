import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Chart from 'chart.js/auto';

type Species = 'dog' | 'cat';

interface AnimalBasic {
  id: number;
  name: string;
  species: Species;
  weightKg: number;
}

interface FoodItem {
  name: string;
  kcalPer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
}

interface FeedingEntry {
  date: string;
  time: string;
  foodName: string;
  amountGrams: number;
  kcal: number;
  notes?: string;
}

type Goal = 'maintenance' | 'weightLoss' | 'weightGain' | 'growth' | 'other';

interface DietSettings {
  targetWeightKg?: number;
  goal: Goal;
  activityNote?: string;
  allergies: string[];
  contraindications: string[];
  dailyEnergyTargetKcal?: number;
}

@Component({
  selector: 'app-diet',
  templateUrl: './diet.component.html',
  styleUrls: ['./diet.component.scss']
})
export class DietComponent {
  animal!: AnimalBasic;
  animalId!: number;
  selectedAnimalId: number | null = null;

  // Ustawienia diety
  settings: DietSettings = {
    goal: 'maintenance',
    allergies: [],
    contraindications: []
  };

  // Formularze
  allergyInput = '';
  contraindicationInput = '';

  feedingForm: Partial<FeedingEntry> & { foodFromLib?: string, customKcalPer100?: number } = {
    date: '',
    time: '',
    foodName: '',
    amountGrams: 0,
    kcal: 0
  };

  // Biblioteka produktów
  foodLibrary: FoodItem[] = [
    { name: 'Karma sucha – adult', kcalPer100g: 350, proteinPer100g: 24, fatPer100g: 14, carbsPer100g: 45 },
    { name: 'Karma mokra – adult',  kcalPer100g: 90,  proteinPer100g: 8,  fatPer100g: 5,  carbsPer100g: 3  },
    { name: 'Kurczak gotowany (pierś)', kcalPer100g: 165, proteinPer100g: 31, fatPer100g: 3.6, carbsPer100g: 0 },
    { name: 'Łosoś gotowany', kcalPer100g: 208, proteinPer100g: 20, fatPer100g: 13, carbsPer100g: 0 },
    { name: 'Ryż gotowany', kcalPer100g: 130, proteinPer100g: 2.4, fatPer100g: 0.3, carbsPer100g: 28 }
  ];

  feedings = [
  {
    date: '2025-08-13',
    time: '08:00',
    foodName: 'Karma sucha – Royal Canin Medium Adult',
    amountGrams: 120,
    kcal: 444,
    notes: 'Śniadanie'
  },
  {
    date: '2025-08-13',
    time: '14:00',
    foodName: 'Kurczak gotowany',
    amountGrams: 80,
    kcal: 132,
    notes: 'Dodatek białkowy'
  },
  {
    date: '2025-08-13',
    time: '19:00',
    foodName: 'Karma mokra – Animonda GranCarno Wołowina',
    amountGrams: 200,
    kcal: 180,
    notes: 'Kolacja'
  },  {
    date: '2025-08-12',
    time: '08:00',
    foodName: 'Karma sucha – Royal Canin Medium Adult',
    amountGrams: 120,
    kcal: 444,
    notes: 'Śniadanie'
  },
  {
    date: '2025-08-12',
    time: '14:00',
    foodName: 'Kurczak gotowany',
    amountGrams: 80,
    kcal: 132,
    notes: 'Dodatek białkowy'
  },
  {
    date: '2025-08-12',
    time: '19:00',
    foodName: 'Karma mokra – Animonda GranCarno Wołowina',
    amountGrams: 200,
    kcal: 180,
    notes: 'Kolacja'
  }
];

  // Wykres
  private chart: Chart | null = null;

  constructor(private route: ActivatedRoute, public router: Router) {
    this.route.params.subscribe(p => {
      const idParam = p['id'];
      // jeśli trasa /diet (bez id) -> domyślnie 1
      const id = idParam ? Number(idParam) : 1;
      this.selectedAnimalId = id;
      this.loadAnimalById(id);
    });
  }

  /** Mock – minimalne dane zwierząt */
  private mockAnimals: AnimalBasic[] = [
    { id: 1, name: 'Rex', species: 'dog', weightKg: 32.5 },
    { id: 2, name: 'Mittens', species: 'cat', weightKg: 4.1 }
  ];

  get animals(): AnimalBasic[] {
    return this.mockAnimals;
  }

  loadAnimalById(id: number) {
    const found = this.mockAnimals.find(a => a.id === id) || this.mockAnimals[0];
    this.animal = { ...found };
    this.animalId = this.animal.id;

    // Ustaw domyślną datę/godzinę
    const now = new Date();
    this.feedingForm.date = now.toISOString().slice(0,10);
    this.feedingForm.time = now.toTimeString().slice(0,5);

    setTimeout(() => this.renderChart(), 0);
  }

  // Zmiana wyboru zwierzęcia w select
  onAnimalChange() {
    const id = this.selectedAnimalId ?? 1;
    // nawigujemy do ładnego adresu /animal/:id/diet
    this.router.navigate(['/animal', id, 'diet']);
  }

  // ---------- Obliczenia energetyczne ----------
  getRER(weightKg: number) { return Math.round(70 * Math.pow(weightKg, 0.75)); }

  getDER(): number {
    if (this.settings.dailyEnergyTargetKcal && this.settings.dailyEnergyTargetKcal > 0) {
      return Math.round(this.settings.dailyEnergyTargetKcal);
    }
    const weightRef = this.settings.targetWeightKg && this.settings.targetWeightKg > 0
      ? this.settings.targetWeightKg
      : this.animal.weightKg;
    const rer = this.getRER(weightRef);
    const factor = this.getFactor(this.animal.species, this.settings.goal);
    return Math.round(rer * factor);
  }

  private getFactor(species: Species, goal: Goal): number {
    if (species === 'dog') {
      switch (goal) {
        case 'maintenance': return 1.6;
        case 'weightLoss':  return 1.0;
        case 'weightGain':  return 1.8;
        case 'growth':      return 2.0;
        default:            return 1.6;
      }
    } else {
      switch (goal) {
        case 'maintenance': return 1.2;
        case 'weightLoss':  return 0.8;
        case 'weightGain':  return 1.4;
        case 'growth':      return 2.5;
        default:            return 1.2;
      }
    }
  }

  // ---------- Biblioteka produktów ----------
  onFoodSelect(name: string) {
    const f = this.foodLibrary.find(x => x.name === name);
    if (!f) return;
    this.feedingForm.foodName = f.name;
    this.updateKcalPreview();
  }

  updateKcalPreview() {
    const amt = Number(this.feedingForm.amountGrams || 0);
    const f = this.foodLibrary.find(x => x.name === this.feedingForm.foodName);
    let kcalPer100 = f?.kcalPer100g;
    if (!f && this.feedingForm.customKcalPer100 && this.feedingForm.customKcalPer100 > 0) {
      kcalPer100 = this.feedingForm.customKcalPer100;
    }
    this.feedingForm.kcal = kcalPer100 ? Math.round(amt * kcalPer100 / 100) : 0;
  }

  addCustomFoodToLibrary() {
    if (!this.feedingForm.foodName || !this.feedingForm.customKcalPer100) return;
    const exists = this.foodLibrary.some(f => f.name.toLowerCase() === this.feedingForm.foodName!.toLowerCase());
    if (!exists) {
      this.foodLibrary = [
        ...this.foodLibrary,
        { name: this.feedingForm.foodName!, kcalPer100g: this.feedingForm.customKcalPer100! }
      ];
    }
  }

  // ---------- Posiłki ----------
  addFeeding() {
    if (!this.feedingForm.date || !this.feedingForm.time || !this.feedingForm.foodName || !this.feedingForm.amountGrams) return;

    if (!this.foodLibrary.find(f => f.name === this.feedingForm.foodName) && this.feedingForm.customKcalPer100) {
      this.addCustomFoodToLibrary();
    }

    const entry: FeedingEntry = {
      date: this.feedingForm.date!,
      time: this.feedingForm.time!,
      foodName: this.feedingForm.foodName!,
      amountGrams: Number(this.feedingForm.amountGrams),
      kcal: Number(this.feedingForm.kcal || 0),
      notes: this.feedingForm.notes?.trim() || undefined
    };

    this.clearFeedingFormKeepDateTime();
    this.renderChart();
  }

  removeFeeding(i: number) {
    this.feedings.splice(i, 1);
    this.renderChart();
  }

  clearFeedingFormKeepDateTime() {
    const d = this.feedingForm.date;
    const t = this.feedingForm.time;
    this.feedingForm = { date: d, time: t, amountGrams: 0, kcal: 0 };
  }

  // ---------- Alergie / przeciwwskazania ----------
  addAllergy() {
    const v = (this.allergyInput || '').trim();
    if (!v) return;
    this.settings.allergies = Array.from(new Set([...this.settings.allergies, v]));
    this.allergyInput = '';
  }
  removeAllergy(idx: number) { this.settings.allergies.splice(idx, 1); }

  addContra() {
    const v = (this.contraindicationInput || '').trim();
    if (!v) return;
    this.settings.contraindications = Array.from(new Set([...this.settings.contraindications, v]));
    this.contraindicationInput = '';
  }
  removeContra(idx: number) { this.settings.contraindications.splice(idx, 1); }

  // ---------- Sumy / grupowanie ----------
  getTotalKcalForDate(date: string) {
    return this.feedings.filter(f => f.date === date).reduce((a, b) => a + b.kcal, 0);
  }

  get uniqueDates(): string[] {
    return Array.from(new Set(this.feedings.map(f => f.date))).sort();
  }

  // ---------- Wykres kalorii (suma dzienna) ----------
  renderChart() {
  const canvas = document.getElementById('dietCaloriesChart') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (this.chart) this.chart.destroy();

  const labels = this.uniqueDates;
  const data = labels.map(d => this.getTotalKcalForDate(d));
  const target = this.getDER();

  this.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Kalorie / dzień',
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: false,
          tension: 0.3
        },
        {
          label: 'Cel (DER)',
          data: labels.map(() => target),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.15)',
          fill: false,
          borderDash: [6, 6],
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: `Kalorie dzienne – ${this.animal.name}` }
      },
      interaction: { mode: 'index', intersect: false },
      scales: { y: { beginAtZero: false } }
    }
  });
}
}
