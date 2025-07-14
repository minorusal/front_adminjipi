import { TestBed } from '@angular/core/testing';
import { CookieService } from './cookie.service';

describe('CookieService', () => {
  let service: CookieService;
  let cookieSetterSpy: jasmine.Spy;
  let cookieGetterSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CookieService]
    });
    service = TestBed.inject(CookieService);
    
    // Spy on the cookie property to intercept assignments and reads
    cookieSetterSpy = spyOnProperty(document, 'cookie', 'set');
    cookieGetterSpy = spyOnProperty(document, 'cookie', 'get');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('set', () => {
    it('should set a cookie with a given name and value', () => {
      service.set('testSet', 'valueSet');
      expect(cookieSetterSpy).toHaveBeenCalledWith('testSet=valueSet; path=/');
    });

    it('should set a cookie with an expiration date', () => {
        const expires = new Date();
        expires.setDate(expires.getDate() + 1);
        service.set('testExpires', 'value', { expires });
        expect(cookieSetterSpy).toHaveBeenCalledWith(`testExpires=value; expires=${expires.toUTCString()}; path=/`);
    });
  });

  describe('delete', () => {
    it('should delete a cookie by setting an expired date', () => {
      service.delete('todelete');
      // The service implementation might add a trailing semicolon
      expect(cookieSetterSpy).toHaveBeenCalledWith('todelete=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;');
    });
  });
  
  describe('get', () => {
    it('should return the value of an existing cookie', () => {
      cookieGetterSpy.and.returnValue('test=testvalue');
      expect(service.get('test')).toBe('testvalue');
    });

    it('should return null for a non-existent cookie', () => {
      cookieGetterSpy.and.returnValue('');
      expect(service.get('nonexistent')).toBeNull();
    });
  });
}); 