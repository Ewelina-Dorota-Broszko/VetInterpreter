import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetPatientProfileComponent } from './vet-patient-profile.component';

describe('VetPatientProfileComponent', () => {
  let component: VetPatientProfileComponent;
  let fixture: ComponentFixture<VetPatientProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VetPatientProfileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VetPatientProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
