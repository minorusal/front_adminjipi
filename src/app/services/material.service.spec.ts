import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MaterialService, Material, CreateMaterialPayload, PaginatedMaterials } from './material.service';
import { environment } from '../../environments/environment';

describe('MaterialService', () => {
  let service: MaterialService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/materials`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MaterialService]
    });
    service = TestBed.inject(MaterialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Make sure that there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMaterials', () => {
    it('should return a paginated list of materials', () => {
      const mockResponse: PaginatedMaterials = {
        docs: [{ id: 1, name: 'Material 1', description: 'Desc 1', sale_price: 100, type_name: 'piece' }],
        totalDocs: 1,
        totalPages: 1,
        page: 1,
        limit: 10
      };

      service.getMaterials(1, 10).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle search queries', () => {
        const mockResponse: PaginatedMaterials = {
            docs: [{ id: 2, name: 'Search Mat', description: 'Desc 2', sale_price: 150, type_name: 'area' }],
            totalDocs: 1,
            totalPages: 1,
            page: 1,
            limit: 5
        };

        service.getMaterials(1, 5, 'search').subscribe(result => {
            expect(result).toEqual(mockResponse);
        });
        
        const req = httpMock.expectOne(`${apiUrl}?page=1&limit=5&search=search`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });
  });

  describe('getMaterialById', () => {
    it('should return a single material', () => {
      const mockMaterial: Material = { id: 1, name: 'Test Material', description: '', material_type_id: 1, owner_id: 1, purchase_price: '10', sale_price: '15', attributes: {}, type_name: 'piece' };

      service.getMaterialById(1).subscribe(result => {
        expect(result).toEqual(mockMaterial);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMaterial);
    });
  });

  describe('createMaterial', () => {
    it('should POST and return the new material', () => {
      const payload: CreateMaterialPayload = { name: 'New Mat', description: 'new', material_type_id: 1, owner_id: 1, purchase_price: 50, attributes: {} };
      const mockResponse: Material = { id: 3, ...payload, sale_price: '60', type_name: 'piece', purchase_price: '50' };

      service.createMaterial(payload).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateMaterial', () => {
    it('should PUT and return the updated material', () => {
      const payload: CreateMaterialPayload = { name: 'Updated Mat', description: 'updated', material_type_id: 1, owner_id: 1, purchase_price: 75, attributes: {} };
      const mockResponse: Material = { id: 1, ...payload, sale_price: '90', type_name: 'piece', purchase_price: '75' };

      service.updateMaterial(1, payload).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('deleteMaterial', () => {
    it('should send a DELETE request', () => {
      service.deleteMaterial(1).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null); // Response for a delete is typically null or empty
    });
  });
}); 