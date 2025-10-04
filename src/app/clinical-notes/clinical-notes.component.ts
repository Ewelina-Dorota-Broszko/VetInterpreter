import { Component, OnInit } from '@angular/core';
import { VetService, ClinicalFile } from '../services/vet.service';

@Component({
  selector: 'app-clinical-notes',
  templateUrl: './clinical-notes.component.html',
  styleUrls: ['./clinical-notes.component.scss']
})
export class ClinicalNotesComponent implements OnInit {

  loading = false;
  uploading = false;
  error = '';

  files: ClinicalFile[] = [];

  selectedFile: File | null = null;
  note = '';

  deleting: Record<string, boolean> = {};
  

  constructor(private vetSvc: VetService) {}

  
  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.vetSvc.getMyClinicalFiles().subscribe({
      next: (list) => {
        this.files = (list || []).sort((a, b) => {
          // najnowsze na górze
          const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          return tb - ta;
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się pobrać listy plików.';
        this.loading = false;
      }
    });
  }

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile = file;
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.note = '';
    const el = document.getElementById('fileInput') as HTMLInputElement | null;
    if (el) el.value = '';
  }

  upload(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.error = '';

    this.vetSvc.uploadMyClinicalFile(this.selectedFile, this.note).subscribe({
      next: (created) => {
        // dołóż na początek listy
        this.files = [created, ...this.files];
        this.uploading = false;
        this.clearSelection();
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się wysłać pliku.';
        this.uploading = false;
      }
    });
  }

  download(f: ClinicalFile): void {
    this.vetSvc.downloadMyClinicalFile(f._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.originalName || 'plik';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się pobrać pliku.';
      }
    });
  }

  remove(f: ClinicalFile): void {
    if (!confirm('Usunąć ten plik?')) return;
    this.deleting[f._id] = true;
    this.vetSvc.deleteMyClinicalFile(f._id).subscribe({
      next: () => {
        this.files = this.files.filter(x => x._id !== f._id);
        this.deleting[f._id] = false;
      },
      error: (err) => {
        this.error = err?.error?.error || 'Nie udało się usunąć pliku.';
        this.deleting[f._id] = false;
      }
    });
  }

  trackById(_: number, f: ClinicalFile) { return f._id; }

  formatBytes(bytes?: number): string {
    if (!bytes && bytes !== 0) return '—';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = (bytes / Math.pow(k, i)).toFixed(1);
    return `${val} ${sizes[i]}`;
  }
  
}
