import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VaccinationsTabComponent } from './vaccinations-tab.component';

describe('VaccinationsTabComponent', () => {
  let component: VaccinationsTabComponent;
  let fixture: ComponentFixture<VaccinationsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VaccinationsTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VaccinationsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
