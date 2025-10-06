import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOwnersListComponent } from './admin-owners-list.component';

describe('AdminOwnersListComponent', () => {
  let component: AdminOwnersListComponent;
  let fixture: ComponentFixture<AdminOwnersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminOwnersListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOwnersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
