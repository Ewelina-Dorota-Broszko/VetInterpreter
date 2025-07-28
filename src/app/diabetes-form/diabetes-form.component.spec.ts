import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiabetesFormComponent } from './diabetes-form.component';

describe('DiabetesFormComponent', () => {
  let component: DiabetesFormComponent;
  let fixture: ComponentFixture<DiabetesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiabetesFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiabetesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
