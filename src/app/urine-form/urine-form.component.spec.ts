import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UrineFormComponent } from './urine-form.component';

describe('UrineFormComponent', () => {
  let component: UrineFormComponent;
  let fixture: ComponentFixture<UrineFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UrineFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UrineFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
