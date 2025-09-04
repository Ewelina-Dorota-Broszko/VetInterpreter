import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyVetComponent } from './my-vet.component';

describe('MyVetComponent', () => {
  let component: MyVetComponent;
  let fixture: ComponentFixture<MyVetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyVetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyVetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
