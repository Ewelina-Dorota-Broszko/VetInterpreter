import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalNotesComponent } from './clinical-notes.component';

describe('ClinicalNotesComponent', () => {
  let component: ClinicalNotesComponent;
  let fixture: ComponentFixture<ClinicalNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClinicalNotesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClinicalNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
