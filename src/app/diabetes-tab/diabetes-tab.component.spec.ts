import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiabetesTabComponent } from './diabetes-tab.component';

describe('DiabetesTabComponent', () => {
  let component: DiabetesTabComponent;
  let fixture: ComponentFixture<DiabetesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiabetesTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiabetesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
