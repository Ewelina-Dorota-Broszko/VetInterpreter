import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loading = false;
  error = '';
  showPass = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  onSubmit() {
  this.error = '';
  if (this.form.invalid) return;

  const { email, password } = this.form.value as { email: string; password: string };

  this.loading = true;
  this.auth.login(email, password).subscribe({
    next: (res: any) => {
      this.loading = false;

      // rola z backendu; fallback na isVet (zgodność wstecz)
      const role = res?.user?.role ?? (res?.user?.isVet ? 'vet' : 'owner');

      // admin + klient -> /profile, wet -> /vet/profile
      const target = role === 'vet' ? '/vet/profile' : '/profile';
      this.router.navigateByUrl(target);
    },
    error: (err: any) => {
      this.loading = false;
      this.error = err?.error?.error || 'Nie udało się zalogować';
    }
  });
}

}
