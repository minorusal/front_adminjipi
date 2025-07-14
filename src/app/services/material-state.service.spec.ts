import { TestBed } from '@angular/core/testing';
import { MaterialStateService } from './material-state.service';
import { MaterialService, PaginatedMaterials } from './material.service';
import { of, throwError } from 'rxjs';
import { skip } from 'rxjs/operators';

describe('MaterialStateService', () => {
  let service: MaterialStateService;
  let materialServiceSpy: jasmine.SpyObj<MaterialService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MaterialService', ['getMaterials']);

    TestBed.configureTestingModule({
      providers: [
        MaterialStateService,
        { provide: MaterialService, useValue: spy }
      ]
    });

    service = TestBed.inject(MaterialStateService);
    materialServiceSpy = TestBed.inject(MaterialService) as jasmine.SpyObj<MaterialService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a valid initial state', (done) => {
    service.paginatedMaterials$.subscribe(data => {
      expect(data).toEqual({
        docs: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        limit: 10
      });
      done();
    });
  });
  
  it('should have an initial error state of null', (done) => {
      service.error$.subscribe(error => {
          expect(error).toBeNull();
          done();
      });
  });

  describe('loadMaterials', () => {
    it('should load materials and update the state on success', (done) => {
      const mockResponse: PaginatedMaterials = {
        docs: [{ id: 1, name: 'Test', description: 'Test Desc', sale_price: 100, type_name: 'piece' }],
        totalDocs: 1,
        totalPages: 1,
        page: 1,
        limit: 10
      };
      materialServiceSpy.getMaterials.and.returnValue(of(mockResponse));

      // Skip the initial emission to only test the result of the load
      service.paginatedMaterials$.pipe(skip(1)).subscribe(data => {
        expect(data).toEqual(mockResponse);
        done();
      });

      service.error$.pipe(skip(1)).subscribe(error => {
          expect(error).toBeNull();
      });

      service.loadMaterials(1, 10);
      expect(materialServiceSpy.getMaterials).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should handle errors and update the error state', (done) => {
      const errorResponse = new Error('Failed to load');
      materialServiceSpy.getMaterials.and.returnValue(throwError(() => errorResponse));

      service.error$.pipe(skip(1)).subscribe(error => {
        expect(error).toBe('Failed to load materials');
        done();
      });

      // We also want to ensure the main data state is not updated on error
      let emissionCount = 0;
      service.paginatedMaterials$.subscribe(data => {
          emissionCount++;
          // Should only ever receive the initial value
          expect(data.docs.length).toBe(0);
      });
      
      service.loadMaterials(1, 10);

      // After the call, we should still only have the initial emission
      expect(emissionCount).toBe(1);
      expect(materialServiceSpy.getMaterials).toHaveBeenCalledWith(1, 10, undefined);
    });
  });
}); 