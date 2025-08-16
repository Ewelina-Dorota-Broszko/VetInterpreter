import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoolTabComponent } from './stool-tab.component';

describe('StoolTabComponent', () => {
  let component: StoolTabComponent;
  let fixture: ComponentFixture<StoolTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoolTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoolTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
