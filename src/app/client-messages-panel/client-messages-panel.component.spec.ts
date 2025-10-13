import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientMessagesPanelComponent } from './client-messages-panel.component';

describe('ClientMessagesPanelComponent', () => {
  let component: ClientMessagesPanelComponent;
  let fixture: ComponentFixture<ClientMessagesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientMessagesPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientMessagesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
