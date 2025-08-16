import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymptomsTabComponent } from './symptoms-tab.component';

describe('SymptomsTabComponent', () => {
  let component: SymptomsTabComponent;
  let fixture: ComponentFixture<SymptomsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SymptomsTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SymptomsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
