import { Component, Input } from '@angular/core';

export interface Vaccination {
  type: string;
  date: string;
  dueDate?: string;
  product?: string;
  batch?: string;
  vet?: string;
  notes?: string;
}

type Status = 'overdue' | 'due' | 'ok' | '—';

@Component({
  selector: 'app-vaccinations-tab',
  templateUrl: './vaccinations-tab.component.html',
  styleUrls: ['./vaccinations-tab.component.scss']
})
export class VaccinationsTabComponent {
  @Input() vaccinations: Vaccination[] = [];

  trackByIndex(i: number) { return i; }

  /** Zwraca status terminu: po terminie / blisko / OK / brak */
  getDueStatus(due?: string | null): Status {
    if (!due) return '—';
    const d = new Date(due);
    if (isNaN(d.getTime())) return '—';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (d < today) return 'overdue';

    const daysLeft = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return daysLeft <= 7 ? 'due' : 'ok';
  }
}
