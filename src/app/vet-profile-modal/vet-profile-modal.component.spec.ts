import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetProfileModalComponent } from './vet-profile-modal.component';

describe('VetProfileModalComponent', () => {
  let component: VetProfileModalComponent;
  let fixture: ComponentFixture<VetProfileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VetProfileModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VetProfileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
