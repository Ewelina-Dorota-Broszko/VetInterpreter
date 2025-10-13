import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetMessagesPanelComponent } from './vet-messages-panel.component';

describe('VetMessagesPanelComponent', () => {
  let component: VetMessagesPanelComponent;
  let fixture: ComponentFixture<VetMessagesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VetMessagesPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VetMessagesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
