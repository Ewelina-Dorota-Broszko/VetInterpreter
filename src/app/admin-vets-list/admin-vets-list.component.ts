import { Component, OnInit } from '@angular/core';
import { AdminService, VetRow } from '../services/admin.service';

type VetUi = VetRow & { 
  _editingPass?: boolean; 
  _newPass?: string; 
  _busy?: boolean;
};

@Component({
  selector: 'app-admin-vets-list',
  templateUrl: './admin-vets-list.component.html',
  styleUrls: ['./admin-vets-list.component.scss']
})
export class AdminVetsListComponent implements OnInit {
  loading = false;
  error = '';
  rows: VetUi[] = [];

  q = '';
  page = 1;
  limit = 10;
  total = 0;
  limits = [10, 25, 50];

  /** 🔹 flaga trybu „pokaż wszystkich” */
  showingAll = false;

  constructor(private admin: AdminService) {}

  ngOnInit(): void { 
    this.load(); 
  }

  /** 🔹 Główne ładowanie danych (uwzględnia tryb „wszyscy”) */
  load() {
    this.loading = true;
    this.error = '';

    const params: any = {
      page: this.page,
      limit: this.limit
    };

    if (!this.showingAll && this.q) {
      params.search = this.q;
    }

    this.admin.listVets(params).subscribe({
      next: (res) => {
        const allVets = res.rows || [];

        // 🔹 Filtr — pomijamy admina
        const filtered = allVets.filter(
          (v: any) => 
            v.email?.toLowerCase() !== 'admin@vetinterpreter.com' &&
            v.name?.toLowerCase() !== 'admin user'
        );

        this.rows = filtered.map(v => ({ ...v, _editingPass: false, _newPass: '', _busy: false }));
        this.total = res.total || filtered.length;
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Nie udało się pobrać listy weterynarzy.';
        this.loading = false;
      }
    });
  }

  /** 🔹 Szukanie */
  onSearch() {
    this.page = 1;
    this.showingAll = false;
    this.load();
  }

  /** 🔹 Pokaż wszystkich */
  showAll() {
    this.q = '';
    this.page = 1;
    this.showingAll = true;
    this.load();
  }

  /** 🔹 Zmiana limitu */
  onLimitChange() {
    this.page = 1;
    this.load();
  }

  /** 🔹 Paginacja */
  prev() {
    if (this.page > 1) { 
      this.page--; 
      this.load(); 
    }
  }

  next() {
    const maxPage = Math.max(1, Math.ceil(this.total / this.limit));
    if (this.page < maxPage) { 
      this.page++; 
      this.load(); 
    }
  }

  /** 🔹 Zakres wyników */
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

  trackById(_: number, r: VetUi) { 
    return r.vetId; 
  }
}
