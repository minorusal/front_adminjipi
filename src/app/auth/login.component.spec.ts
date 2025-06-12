import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule, RouterTestingModule],
      declarations: [LoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send login request and navigate on success', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.email = 'test@example.com';
    component.password = 'secret';

    component.login();

    const req = httpMock.expectOne('http://localhost:3000/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: '123' });

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set error on login failure', () => {
    component.email = 'test@example.com';
    component.password = 'wrong';

    component.login();

    const req = httpMock.expectOne('http://localhost:3000/auth/login');
    req.flush('Invalid', { status: 401, statusText: 'Unauthorized' });

    expect(component.error).toBe('Login failed');
  });
});
