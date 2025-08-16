import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BloodTabComponent } from './blood-tab.component';

describe('BloodTabComponent', () => {
  let component: BloodTabComponent;
  let fixture: ComponentFixture<BloodTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BloodTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BloodTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
