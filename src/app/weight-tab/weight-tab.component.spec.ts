import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeightTabComponent } from './weight-tab.component';

describe('WeightTabComponent', () => {
  let component: WeightTabComponent;
  let fixture: ComponentFixture<WeightTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WeightTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WeightTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
