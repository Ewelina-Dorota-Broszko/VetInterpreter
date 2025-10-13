import { Component, OnInit } from '@angular/core';
import { VetService, ClinicalFile } from 'src/app/services/vet.service';

@Component({
  selector: 'app-clinical-notes',
  templateUrl: './clinical-notes.component.html',
  styleUrls: ['./clinical-notes.component.scss']
})
export class ClinicalNotesComponent implements OnInit {
  files: ClinicalFile[] = [];
  fileToUpload?: File | null;
  note = '';
  uploading = false;
  error = '';

  constructor(private vet: VetService) {}

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles() {
    this.vet.getMyClinicalFilesV2().subscribe({
      next: (res) => this.files = res,
      error: (err) => this.error = err?.error?.error || 'Nie udało się pobrać listy plików'
    });
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.fileToUpload = input.files && input.files[0] ? input.files[0] : null;
  }

  upload() {
    if (!this.fileToUpload) {
      this.error = 'Wybierz plik przed wysłaniem.';
      return;
    }
    this.uploading = true;
    this.vet.uploadMyClinicalFileV2(this.fileToUpload, this.note).subscribe({
      next: () => {
        this.uploading = false;
        this.fileToUpload = null;
        this.note = '';
        this.loadFiles();
      },
      error: (err) => {
        this.uploading = false;
        this.error = err?.error?.error || 'Nie udało się wgrać pliku';
      }
    });
  }

  open(file: ClinicalFile) {
    this.vet.downloadClinicalFileV2Blob(file._id).subscribe({
      next: (res) => {
        const mime = res.headers.get('Content-Type') || 'application/octet-stream';
        const blob = new Blob([res.body as BlobPart], { type: mime });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      },
      error: () => this.error = 'Nie udało się otworzyć pliku'
    });
  }

  delete(file: ClinicalFile) {
    if (!confirm(`Usunąć plik "${file.originalName}"?`)) return;
    this.vet.deleteClinicalFileV2(file._id).subscribe({
      next: () => this.loadFiles(),
      error: (err) => this.error = err?.error?.error || 'Nie udało się usunąć pliku'
    });
  }

  /** ikony wg rozszerzenia */
  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'assets/images/pdf.png';
      case 'png': return 'assets/images/png.png';
      case 'jpg': return 'assets/images/jpg.png';
      case 'jpeg': return 'assets/images/jpg.png';
      case 'webp': return 'assets/images/webp.png';
      case 'doc': return 'assets/images/doc.png';
      case 'docx': return 'assets/images/doc.png';
      default: return 'assets/images/file.png';
    }
  }

  /** klasa stylu wg typu */
  fileTypeClass(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'img';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    return 'other';
  }
  truncateName(name: string, limit: number = 30): string {
  if (!name) return '';
  return name.length > limit ? name.substring(0, limit) + '…' : name;
}
isDragOver = false;

triggerFileInput() {
  const input = document.getElementById('fileInput') as HTMLInputElement;
  input?.click();
}

onDragOver(event: DragEvent) {
  event.preventDefault();
  this.isDragOver = true;
}

onDragLeave(event: DragEvent) {
  event.preventDefault();
  this.isDragOver = false;
}

onDrop(event: DragEvent) {
  event.preventDefault();
  this.isDragOver = false;

  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    this.fileToUpload = event.dataTransfer.files[0];
  }
}


}
