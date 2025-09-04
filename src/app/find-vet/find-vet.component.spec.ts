import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindVetComponent } from './find-vet.component';

describe('FindVetComponent', () => {
  let component: FindVetComponent;
  let fixture: ComponentFixture<FindVetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FindVetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FindVetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
