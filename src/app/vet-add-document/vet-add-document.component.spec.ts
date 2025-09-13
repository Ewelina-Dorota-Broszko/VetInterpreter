import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VetAddDocumentComponent } from './vet-add-document.component';

describe('VetAddDocumentComponent', () => {
  let component: VetAddDocumentComponent;
  let fixture: ComponentFixture<VetAddDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VetAddDocumentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VetAddDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
