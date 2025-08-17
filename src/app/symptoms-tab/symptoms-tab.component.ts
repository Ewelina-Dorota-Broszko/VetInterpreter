import { Component, Input } from '@angular/core';

export interface SymptomLog {
  date: string;
  symptomTags?: string[];
  painScore?: number;
  energy?: number;
  appetite?: number;
  notes?: string;
}

@Component({
  selector: 'app-symptoms-tab',
  templateUrl: './symptoms-tab.component.html',
  styleUrls: ['./symptoms-tab.component.scss']
})
export class SymptomsTabComponent {
  @Input() symptoms: SymptomLog[] = [];

  trackByIndex(i: number) {
    return i;
  }
}
