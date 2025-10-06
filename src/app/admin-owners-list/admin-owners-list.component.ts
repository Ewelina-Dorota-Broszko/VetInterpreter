import { Component, OnInit } from '@angular/core';
import { AdminService, OwnerRow } from '../services/admin.service';

type OwnerUi = OwnerRow & { _editingPass?: boolean; _newPass?: string; _busy?: boolean; _expanded?: boolean };

@Component({
  selector: 'app-admin-owners-list',
  templateUrl: './admin-owners-list.component.html',
  styleUrls: ['./admin-owners-list.component.scss']
})
export class AdminOwnersListComponent implements OnInit {
  loading = false;
  error = '';
  rows: OwnerUi[] = [];

  q = '';
  page = 1;
  limit = 10;
  total = 0;
  limits = [10, 25, 50];

  constructor(private admin: AdminService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.admin.listOwners({
      search: this.q || undefined,
      page: this.page,
      limit: this.limit,
      includeAnimals: '1'
    }).subscribe({
      next: (res) => {
        this.rows = (res.rows || []).map(r => ({ ...r, _editingPass: false, _newPass: '', _busy: false, _expanded: false }));
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Nie udało się pobrać listy klientów.';
        this.loading = false;
      }
    });
  }

  onSearch() { this.page = 1; this.load(); }
  onLimitChange() { this.page = 1; this.load(); }

  prev() {
    if (this.page > 1) { this.page--; this.load(); }
  }
  next() {
    const maxPage = Math.max(1, Math.ceil(this.total / this.limit));
    if (this.page < maxPage) { this.page++; this.load(); }
  }

  rangeText(): string {
    if (!this.total) return '0/0';
    const start = (this.page - 1) * this.limit + 1;
    const end = Math.min(this.page * this.limit, this.total);
    return `${start}–${end} z ${this.total}`;
  }

  toggleExpand(r: OwnerUi) { r._expanded = !r._expanded; }

  togglePass(row: OwnerUi) {
    row._editingPass = !row._editingPass;
    if (!row._editingPass) row._newPass = '';
  }

  resetPass(row: OwnerUi) {
    if (!row._newPass || row._newPass.length < 6) {
      alert('Hasło musi mieć min. 6 znaków.');
      return;
    }
    if (row._busy) return;
    row._busy = true;
    this.admin.resetOwnerPassword(row.ownerId, row._newPass).subscribe({
      next: () => {
        row._busy = false;
        row._editingPass = false;
        row._newPass = '';
        alert('Hasło zresetowane.');
      },
      error: (e) => {
        row._busy = false;
        alert(e?.error?.error || 'Nie udało się zresetować hasła.');
      }
    });
  }

  deleteOwner(row: OwnerUi) {
    if (!confirm(`Usunąć konto klienta ${row.email}? Spowoduje to również usunięcie jego zwierząt.`)) return;
    if (row._busy) return;
    row._busy = true;
    this.admin.deleteOwner(row.ownerId).subscribe({
      next: () => {
        row._busy = false;
        this.load();
      },
      error: (e) => {
        row._busy = false;
        alert(e?.error?.error || 'Nie udało się usunąć konta.');
      }
    });
  }

  trackByOwnerId(_: number, r: OwnerUi) { return r.ownerId; }
  trackByAnimalId(_: number, a: any) { return a?._id; }
}
