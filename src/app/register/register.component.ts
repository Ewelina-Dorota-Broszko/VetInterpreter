import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  loading = false;
  error = '';
  showPass = false;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    isVet: [false, [Validators.required]] // backend wymaga pola isVet (true/false)
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  toggleShowPass() {
    this.showPass = !this.showPass;
  }

  onSubmit() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value as {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
      isVet: boolean;
    };

    this.loading = true;
    this.auth.register(payload).subscribe({
      next: (res: any) => {
        this.loading = false;

        // 🔹 Przykładowa odpowiedź z backendu może zawierać dane usera
        const user = res?.user || res;

        // 🔸 Logika przekierowania po roli
       
        if (user?.role === 'admin') {
          this.router.navigate(['/admin/panel']);

        } else if (user?.isVet) {
          this.router.navigate(['/vet/profile']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Nie udało się zarejestrować';
      }
    });
  }
}
