import { Component, OnInit } from '@angular/core';
import { AdminService, VetRow } from '../services/admin.service';

type VetUi = VetRow & { _editingPass?: boolean; _newPass?: string; _busy?: boolean };

@Component({
  selector: 'app-admin-vets-list',
  templateUrl: './admin-vets-list.component.html',
  styleUrls: ['./admin-vets-list.component.scss']
})
export class AdminVetsListComponent implements OnInit {
  loading = false;
  error = '';
  rows: VetUi[] = [];

  // filtr/paginacja
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
    this.admin.listVets({ search: this.q || undefined, page: this.page, limit: this.limit }).subscribe({
      next: (res) => {
        this.rows = (res.rows || []).map(r => ({ ...r, _editingPass: false, _newPass: '', _busy: false }));
        this.total = res.total || 0;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Nie udało się pobrać listy weterynarzy.';
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

  togglePass(row: VetUi) {
    row._editingPass = !row._editingPass;
    if (!row._editingPass) row._newPass = '';
  }

  resetPass(row: VetUi) {
    if (!row._newPass || row._newPass.length < 6) {
      alert('Hasło musi mieć min. 6 znaków.');
      return;
    }
    if (row._busy) return;
    row._busy = true;
    this.admin.resetVetPassword(row.vetId, row._newPass).subscribe({
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

  deleteVet(row: VetUi) {
    if (!confirm(`Usunąć konto weta ${row.email}?`)) return;
    if (row._busy) return;
    row._busy = true;
    this.admin.deleteVet(row.vetId).subscribe({
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

  trackById(_: number, r: VetUi) { return r.vetId; }
}
