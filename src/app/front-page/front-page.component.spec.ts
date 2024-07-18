import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrontPageComponent } from './front-page.component';

describe('FrontPageComponent', () => {
  let component: FrontPageComponent;
  let fixture: ComponentFixture<FrontPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FrontPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FrontPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default service (AI)', () => {
    expect(component.selectedService.title).toEqual('Analiza wyników badań przez AI');
  });

  it('should change selectedService when selectService is called', () => {
    const serviceKey: keyof typeof component.services = 'data-management';
    component.selectService(serviceKey);
    expect(component.selectedService.title).toEqual('Zarządzanie danymi');
  });
  

  describe('FrontPageComponent UI', () => {
    let component: FrontPageComponent;
    let fixture: ComponentFixture<FrontPageComponent>;
    let compiled: any; // variable to hold compiled HTML element
  
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        declarations: [ FrontPageComponent ]
      })
      .compileComponents();
    });
  
    beforeEach(() => {
      fixture = TestBed.createComponent(FrontPageComponent);
      component = fixture.componentInstance;
      compiled = fixture.nativeElement;
      fixture.detectChanges();
    });
  
    it('should display correct service title', () => {
      expect(compiled.querySelector('.service-title').textContent).toContain(component.selectedService.title);
    });
  
    it('should display correct service text', () => {
      expect(compiled.querySelector('.service-text').textContent).toContain(component.selectedService.text);
    });

  });
  
});
