import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedsTabComponent } from './meds-tab.component';

describe('MedsTabComponent', () => {
  let component: MedsTabComponent;
  let fixture: ComponentFixture<MedsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedsTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
