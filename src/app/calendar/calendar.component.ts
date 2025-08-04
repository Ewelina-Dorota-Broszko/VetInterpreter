import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  @Input() currentDogId: string = 'rex-123';
  @ViewChild('fullcalendar') calendarComponent!: FullCalendarComponent;

  selectedDate: string | null = null;

  notes: { [dogId: string]: { [date: string]: string[] } } = {
    'rex-123': {
      '2025-08-04': ['Badanie kontrolne – Rex', 'Zalecono dietę lekkostrawną'],
      '2025-08-10': ['Wizyta kontrolna po leczeniu']
    },
    'luna-789': {
      '2025-08-04': ['Szczepienie przeciwko wściekliźnie']
    }
  };

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    selectable: true, // <== Umożliwia klikanie w puste kratki
    dateClick: (arg) => this.handleDateClick(arg),
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    events: [
      { title: 'Vet Visit - Rex', date: '2025-08-04' },
      { title: 'Follow-up', date: '2025-08-10' },
      { title: 'Visit', date: '2025-08-04' }
    ]
  };

  ngOnInit(): void {}

  handleDateClick(arg: any): void {
    this.selectedDate = arg.dateStr;
  }

  getNotesForSelectedDate(): string[] {
    return this.notes[this.currentDogId]?.[this.selectedDate!] || [];
  }
}
