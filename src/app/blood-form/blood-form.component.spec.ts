import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BloodFormComponent } from './blood-form.component';

describe('BloodFormComponent', () => {
  let component: BloodFormComponent;
  let fixture: ComponentFixture<BloodFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BloodFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BloodFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
