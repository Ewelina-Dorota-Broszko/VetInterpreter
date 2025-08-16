import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemperatureTabComponent } from './temperature-tab.component';

describe('TemperatureTabComponent', () => {
  let component: TemperatureTabComponent;
  let fixture: ComponentFixture<TemperatureTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemperatureTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemperatureTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
