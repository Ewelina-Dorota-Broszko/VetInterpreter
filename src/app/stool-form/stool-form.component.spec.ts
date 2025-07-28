import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoolFormComponent } from './stool-form.component';

describe('StoolFormComponent', () => {
  let component: StoolFormComponent;
  let fixture: ComponentFixture<StoolFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoolFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoolFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
