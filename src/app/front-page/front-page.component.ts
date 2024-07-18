import { Component } from '@angular/core';

interface ServiceContent {
  title: string;
  text: string;
  ticks: string[];
  additionalText: string;
  image: string;
}

@Component({
  selector: 'app-front-page',
  templateUrl: './front-page.component.html',
  styleUrls: ['./front-page.component.scss']
})
export class FrontPageComponent {
  services = {
    ai: {
      title: 'Analiza wyników badań przez AI',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ticks: ['Punkt 1', 'Punkt 2', 'Punkt 3'],
      additionalText: 'Dodatkowy tekst dla AI.',
      image: '../../assets/images/IMG_1374.png'
    },
    'data-management': {
      title: 'Zarządzanie danymi',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ticks: ['Punkt 1', 'Punkt 2', 'Punkt 3'],
      additionalText: 'Dodatkowy tekst dla Zarządzanie danymi.',
      image: '../../assets/images/IMG_1352.png'
    },
    'report-generation': {
      title: 'Generowanie raportów / statystyk',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ticks: ['Punkt 1', 'Punkt 2', 'Punkt 3'],
      additionalText: 'Dodatkowy tekst dla Generowanie raportów / statystyk.',
      image: '../../assets/images/IMG_0419.png'
    },
    'appointment-creation': {
      title: 'Tworzenie i edycja wizyt',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ticks: ['Punkt 1', 'Punkt 2', 'Punkt 3'],
      additionalText: 'Dodatkowy tekst dla Tworzenie i edycja wizyt.',
      image: '../../assets/images/IMG_1374.png'
    },
    'vet-panel': {
      title: 'Panel dla weterynarzy',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      ticks: ['Punkt 1', 'Punkt 2', 'Punkt 3'],
      additionalText: 'Dodatkowy tekst dla Panel dla weterynarzy.',
      image: '../../assets/images/IMG_1352.png'
    }
  };

  selectedService: ServiceContent = this.services.ai;

  selectService(serviceKey: keyof typeof this.services) {
    this.selectedService = this.services[serviceKey];
  }
}
