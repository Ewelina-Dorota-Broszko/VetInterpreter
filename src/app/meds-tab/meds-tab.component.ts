import { Component, Input } from '@angular/core';

export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  timesOfDay?: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

@Component({
  selector: 'app-meds-tab',
  templateUrl: './meds-tab.component.html',
  styleUrls: ['./meds-tab.component.scss']
})
export class MedsTabComponent {
  @Input() medications: Medication[] = [];

  trackByIndex(i: number) {
    return i;
  }
}
