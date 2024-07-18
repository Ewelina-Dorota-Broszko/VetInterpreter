import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  hasPet: string = 'Tak'; // Początkowa wartość
  successMessage: string | null = null;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]], // Tylko cyfry
      subject: ['', Validators.required],
      has_pet: ['Tak'], // Początkowa wartość
      pets: this.fb.group({
        dog: [false],
        cat: [false],
        reptile: [false],
        rodent: [false],
        bird: [false]
      }),
      message: ['', Validators.required]
    });

    this.hasPet = this.contactForm.get('has_pet')?.value ?? 'Tak';
  }

  ngOnInit(): void {
    this.contactForm.get('has_pet')?.valueChanges.subscribe(value => {
      this.hasPet = value;
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched(); // Zaznacza wszystkie pola jako dotknięte, aby pokazać błędy
      return;
    }

    fetch('https://formspree.io/f/myzgzqwy', {
      method: 'POST',
      body: JSON.stringify(this.contactForm.value),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        this.successMessage = 'Twoja wiadomość została wysłana pomyślnie!';
        this.contactForm.reset();
        this.hasPet = 'Tak'; 
      } else {
        this.successMessage = 'Wystąpił problem podczas wysyłania formularza. Spróbuj ponownie później.';
      }
    })
    .catch(error => {
      console.error('Wystąpił błąd:', error);
      this.successMessage = 'Wystąpił problem podczas wysyłania formularza. Spróbuj ponownie później.';
    });
  }

  getFormControl(name: string) {
    return this.contactForm.get(name) ?? { valid: true, touched: false }; 
  }
}
