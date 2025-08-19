import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedsFormComponent } from './meds-form.component';

describe('MedsFormComponent', () => {
  let component: MedsFormComponent;
  let fixture: ComponentFixture<MedsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MedsFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MedsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
