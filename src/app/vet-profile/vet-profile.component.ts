import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { VetService, VetProfile, WorkingHour } from '../services/vet.service';

type StrArr = string[];

@Component({
  selector: 'app-vet-profile',
  templateUrl: './vet-profile.component.html',
  styleUrls: ['./vet-profile.component.scss']
})
export class VetProfileComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  okMsg = '';
  editMode = false;
  userId: string | null = null;


  /** ID zalogowanego weterynarza (z /vet/me) */
  vetId: string | null = null;

  /** aktualnie zapisane dane (do podglądu i resetu zmian) */
  currentData: VetProfile | null = null;

  /** domyślne (nieusuwalne) */
  specialtyOptions: StrArr = [
    'Medycyna ogólna','Chirurgia','Stomatologia','Dermatologia',
    'Kardiologia','Endokrynologia','Okulistyka','Onkologia',
    'Ortopedia','Rozród','Radiologia/USG'
  ];
  serviceOptions: StrArr = [
    'Konsultacje','Szczepienia','Odrobaczanie','Czipowanie',
    'Badania krwi','Badanie moczu','RTG','USG','EKG',
    'Zabiegi chirurgiczne','Stomatologia','Hospitalizacja','Wizyty domowe'
  ];
  languageOptions: StrArr = ['polski','angielski','niemiecki','ukraiński','rosyjski','francuski','hiszpański'];
  paymentOptions:  StrArr = ['gotówka','karta','BLIK','przelew'];

  /** własne (custom) – utrzymują widoczność niezależnie od zaznaczenia */
  private customSpecialtiesSet = new Set<string>();
  private customServicesSet = new Set<string>();

  days = [
    { idx: 0, label: 'Poniedziałek' },
    { idx: 1, label: 'Wtorek' },
    { idx: 2, label: 'Środa' },
    { idx: 3, label: 'Czwartek' },
    { idx: 4, label: 'Piątek' },
    { idx: 5, label: 'Sobota' },
    { idx: 6, label: 'Niedziela' }
  ];

  newSpecialties = '';
  newServices = '';

  form = this.fb.group({
    clinicName: ['', Validators.required],
    licenseNo:  ['', Validators.required],
    phone:      ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    website:    [''],
    about:      [''],

    address: this.fb.group({
      line1:      [''],
      line2:      [''],
      city:       [''],
      postalCode: [''],
      country:    ['Polska']
    }),

    acceptsNewPatients: [true],
    acceptsEmergency:   [false],
    emergencyPhone:     [''],

    specialties:     this.fb.control([] as string[]),   // zaznaczone
    servicesOffered: this.fb.control([] as string[]),   // zaznaczone
    languages:       this.fb.control([] as string[]),
    paymentMethods:  this.fb.control([] as string[]),

    appointmentDurationMin: [20, [Validators.min(5), Validators.max(180)]],
    consultPrice:           [0,  [Validators.min(0)]],

    workingHours: this.fb.array([])
  });

  get hoursFA(): FormArray { return this.form.get('workingHours') as FormArray; }

  constructor(private fb: FormBuilder, private vet: VetService) {}

  ngOnInit(): void {
    this.initDefaultHours();

    this.vet.getMe().subscribe({
  next: (p: VetProfile & { id?: string; _id?: string; userId?: any }) => {
    // 🔐 ID profilu veta – bierz id, albo _id (zmapuj na string)
    this.vetId = (p?.id as string)
              || (p?._id ? String(p._id) : null);

    // (opcjonalnie) ID użytkownika powiązanego z profilem
    this.userId = p?.userId ? String(p.userId) : null;

    this.currentData = this.normalizeProfile(p);

    // custom sety (bez zmian)
    (this.currentData.specialties || []).forEach(s => {
      if (!this.specialtyOptions.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
        this.customSpecialtiesSet.add(s);
      }
    });
    (this.currentData.servicesOffered || []).forEach(s => {
      if (!this.serviceOptions.map(x => x.toLowerCase()).includes(s.toLowerCase())) {
        this.customServicesSet.add(s);
      }
    });

    this.patchForm(this.currentData);
    this.loading = false;
    this.editMode = false;
  },
  error: (e) => {
    this.error = e?.error?.error || 'Nie udało się pobrać profilu';
    this.loading = false;
  }
});

  }

  /* ===== Tryby ===== */
  switchToEdit() {
    this.okMsg = '';
    if (this.currentData) this.patchForm(this.currentData);
    this.editMode = true;
  }

  cancelEdit() {
    this.error = ''; this.okMsg = '';
    if (this.currentData) this.patchForm(this.currentData);
    this.editMode = false;
  }

  save() {
    this.error = ''; this.okMsg = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.form.value.acceptsEmergency && !this.form.value.emergencyPhone) {
      this.error = 'Podaj numer telefonu do nagłych przypadków.';
      return;
    }

    const payload = this.form.value as Partial<VetProfile>;
    this.saving = true;
    this.vet.updateMe(payload).subscribe({
      next: (saved) => {
        this.okMsg = 'Zapisano profil';
        this.saving = false;
        this.currentData = this.normalizeProfile(saved);
        this.patchForm(this.currentData);
        this.editMode = false;
      },
      error: (e) => {
        this.error = e?.error?.error || e?.message || 'Błąd zapisu';
        this.saving = false;
      }
    });
  }

  /* ===== Godziny ===== */
  private initDefaultHours() {
    this.hoursFA.clear();
    for (const d of this.days) {
      this.hoursFA.push(
        this.fb.group({
          day:        [d.idx],
          open:       [false],
          start:      ['09:00'],
          end:        ['17:00'],
          breakStart: [''],
          breakEnd:   ['']
        })
      );
    }
  }

  private setHoursFromServer(hours: WorkingHour[]) {
    const byDay = new Map<number, WorkingHour>();
    hours.forEach(h => byDay.set(h.day, h));
    this.hoursFA.controls.forEach((ctrl: any) => {
      const day = ctrl.get('day')!.value as number;
      const src = byDay.get(day);
      if (src) {
        ctrl.patchValue({
          open:       !!src.open,
          start:      src.start      ?? '09:00',
          end:        src.end        ?? '17:00',
          breakStart: src.breakStart ?? '',
          breakEnd:   src.breakEnd   ?? ''
        });
      }
    });
  }

  private patchForm(p: VetProfile) {
    this.form.patchValue({
      clinicName: p.clinicName ?? '',
      licenseNo:  p.licenseNo  ?? '',
      phone:      p.phone      ?? '',
      email:      p.email      ?? '',
      website:    p.website    ?? '',
      about:      p.about      ?? '',
      acceptsNewPatients: p.acceptsNewPatients ?? true,
      acceptsEmergency:   p.acceptsEmergency   ?? false,
      emergencyPhone:     p.emergencyPhone     ?? '',
      specialties:        p.specialties        ?? [],
      servicesOffered:    p.servicesOffered    ?? [],
      languages:          p.languages          ?? [],
      paymentMethods:     p.paymentMethods     ?? [],
      appointmentDurationMin: p.appointmentDurationMin ?? 20,
      consultPrice:           p.consultPrice           ?? 0
    });

    (this.form.get('address') as FormGroup).patchValue({
      line1:      p.address?.line1      ?? '',
      line2:      p.address?.line2      ?? '',
      city:       p.address?.city       ?? '',
      postalCode: p.address?.postalCode ?? '',
      country:    p.address?.country    ?? 'Polska'
    });

    this.initDefaultHours();
    if (p.workingHours?.length) this.setHoursFromServer(p.workingHours);
  }

  private normalizeProfile(p: VetProfile): VetProfile {
    return {
      clinicName: p.clinicName || '',
      licenseNo:  p.licenseNo  || '',
      phone:      p.phone      || '',
      email:      p.email      || '',
      website:    p.website    || '',
      about:      p.about      || '',
      address: {
        line1:      p.address?.line1      || '',
        line2:      p.address?.line2      || '',
        city:       p.address?.city       || '',
        postalCode: p.address?.postalCode || '',
        country:    p.address?.country    || 'Polska'
      },
      acceptsNewPatients: p.acceptsNewPatients ?? true,
      acceptsEmergency:   p.acceptsEmergency   ?? false,
      emergencyPhone:     p.emergencyPhone     || '',
      specialties:        p.specialties        || [],
      servicesOffered:    p.servicesOffered    || [],
      languages:          p.languages          || [],
      paymentMethods:     p.paymentMethods     || [],
      appointmentDurationMin: p.appointmentDurationMin ?? 20,
      consultPrice:           p.consultPrice           ?? 0,
      workingHours: (p.workingHours && p.workingHours.length)
        ? p.workingHours
        : this.days.map(d => ({
            day: d.idx, open: false, start: '09:00', end: '17:00', breakStart: '', breakEnd: ''
          }))
    };
  }

  /* ===== Checkboxy i listy ===== */

  /** Checkbox: zaznacz/odznacz (NIE usuwa z listy!) */
  toggleMulti(
    controlName: 'specialties'|'servicesOffered'|'languages'|'paymentMethods',
    value: string,
    checked: boolean
  ) {
    const ctrl = this.form.get(controlName) as FormControl;
    const current = (ctrl.value as string[]) ?? [];
    const set = new Set(current);

    if (checked) set.add(value);
    else set.delete(value);  // odznacz — pozycja pozostaje widoczna (custom-set trzyma listę)

    ctrl.setValue(Array.from(set));
    ctrl.markAsDirty();
  }

  isChecked(
    controlName: 'specialties'|'servicesOffered'|'languages'|'paymentMethods',
    value: string
  ) {
    const v = (this.form.get(controlName) as FormControl)?.value as string[] || [];
    return v.map(x => x.toLowerCase()).includes(value.toLowerCase());
  }

  /** Widoczne = DOMYŚLNE + CUSTOM (nie: “zaznaczone”) */
  getMergedOptions(controlName: 'specialties'|'servicesOffered'): string[] {
    const base = controlName === 'specialties' ? this.specialtyOptions : this.serviceOptions;
    const custom = controlName === 'specialties'
      ? Array.from(this.customSpecialtiesSet)
      : Array.from(this.customServicesSet);

    const set = new Set<string>([...base, ...custom]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl', { sensitivity: 'base' }));
  }

  
  /** Dodaj własne (można wiele po przecinku). Po dodaniu od razu zaznaczamy. */
  addCustomOptions(controlName: 'specialties'|'servicesOffered', inputValue: string) {
    const items = (inputValue || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!items.length) return;

    if (controlName === 'specialties') {
      items.forEach(s => this.customSpecialtiesSet.add(s));
      const ctrl = this.form.get('specialties') as FormControl;
      const cur = (ctrl.value as string[]) ?? [];
      const set = new Set(cur);
      items.forEach(s => set.add(s));
      ctrl.setValue(Array.from(set));
      ctrl.markAsDirty();
      this.newSpecialties = '';
    } else {
      items.forEach(s => this.customServicesSet.add(s));
      const ctrl = this.form.get('servicesOffered') as FormControl;
      const cur = (ctrl.value as string[]) ?? [];
      const set = new Set(cur);
      items.forEach(s => set.add(s));
      ctrl.setValue(Array.from(set));
      ctrl.markAsDirty();
      this.newServices = '';
    }
  }

  /** Usuń CAŁKOWICIE (tylko custom). Dodatkowo odznacz w zaznaczonych. */
  removeOption(controlName: 'specialties'|'servicesOffered', value: string) {
    if (controlName === 'specialties') {
      this.customSpecialtiesSet.delete(value);
      const ctrl = this.form.get('specialties') as FormControl;
      const cur = (ctrl.value as string[]) ?? [];
      ctrl.setValue(cur.filter(v => v.toLowerCase() !== value.toLowerCase()));
      ctrl.markAsDirty();
    } else {
      this.customServicesSet.delete(value);
      const ctrl = this.form.get('servicesOffered') as FormControl;
      const cur = (ctrl.value as string[]) ?? [];
      ctrl.setValue(cur.filter(v => v.toLowerCase() !== value.toLowerCase()));
      ctrl.markAsDirty();
    }
  }

  onEmergencyToggle() {
    const on = this.form.get('acceptsEmergency')?.value;
    if (!on) this.form.get('emergencyPhone')?.setValue('');
  }
}
