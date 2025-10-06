import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVetsListComponent } from './admin-vets-list.component';

describe('AdminVetsListComponent', () => {
  let component: AdminVetsListComponent;
  let fixture: ComponentFixture<AdminVetsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminVetsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminVetsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
