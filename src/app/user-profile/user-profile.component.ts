import { Component, OnInit } from '@angular/core';
import { OwnerService } from '../services/owner.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  profile: { owner: any; animals: any[] } | null = null;
  loading = false;
  error: string | null = null;

  constructor(private ownerService: OwnerService) {}

  ngOnInit(): void {
    this.loading = true;
    this.ownerService.getMyFullProfile().subscribe({
      next: (data) => { this.profile = data; this.loading = false; },
      error: (err) => {
        this.error = err.error?.error || 'Błąd ładowania profilu';
        this.loading = false;
      }
    });
  }

  getSpeciesLabel(s: string) { return s === 'dog' ? 'Pies' : s === 'cat' ? 'Kot' : s; }
}
