import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { CookieService } from '../services/cookie.service';

describe('AuthInterceptor', () => {
  let cookieServiceSpy: jasmine.SpyObj<CookieService>;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    cookieServiceSpy = jasmine.createSpyObj('CookieService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: CookieService, useValue: cookieServiceSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    const interceptor: AuthInterceptor = TestBed.inject(AuthInterceptor);
    expect(interceptor).toBeTruthy();
  });

  it('should add token header if token exists', () => {
    const testToken = 'test-token';
    cookieServiceSpy.get.withArgs('token').and.returnValue(testToken);

    httpClient.get('/test').subscribe();

    const httpRequest = httpMock.expectOne('/test');
    expect(httpRequest.request.headers.has('token')).toBe(true);
    expect(httpRequest.request.headers.get('token')).toBe(testToken);
  });

  it('should not add token header if token does not exist', () => {
    cookieServiceSpy.get.withArgs('token').and.returnValue(null);

    httpClient.get('/test').subscribe();

    const httpRequest = httpMock.expectOne('/test');
    expect(httpRequest.request.headers.has('token')).toBe(false);
  });
});
