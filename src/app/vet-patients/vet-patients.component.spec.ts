import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetPatientsComponent } from './vet-patients.component';

describe('VetPatientsComponent', () => {
  let component: VetPatientsComponent;
  let fixture: ComponentFixture<VetPatientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VetPatientsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VetPatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
