import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimalsAddFormComponent } from './animals-add-form.component';

describe('AnimalsAddFormComponent', () => {
  let component: AnimalsAddFormComponent;
  let fixture: ComponentFixture<AnimalsAddFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnimalsAddFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimalsAddFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
