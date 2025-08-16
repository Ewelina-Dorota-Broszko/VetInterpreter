import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrineTabComponent } from './urine-tab.component';

describe('UrineTabComponent', () => {
  let component: UrineTabComponent;
  let fixture: ComponentFixture<UrineTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UrineTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UrineTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
