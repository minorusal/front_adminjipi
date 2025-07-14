import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MaterialTypeService, MaterialType } from './material-type.service';
import { environment } from '../../environments/environment';

describe('MaterialTypeService', () => {
  let service: MaterialTypeService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/material-types`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MaterialTypeService]
    });
    service = TestBed.inject(MaterialTypeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve all material types', () => {
    const mockTypes: MaterialType[] = [
      { id: 1, name: 'Wood', unit: 'm2', description: 'desc' },
      { id: 2, name: 'Metal', unit: 'kg', description: 'desc' }
    ];

    service.getMaterialTypes().subscribe(types => {
      expect(types.length).toBe(2);
      expect(types).toEqual(mockTypes);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockTypes);
  });

  it('should retrieve a material type by ID', () => {
    const mockType: MaterialType = { id: 1, name: 'Wood', unit: 'm2', description: 'desc' };

    service.getMaterialTypeById(1).subscribe(type => {
      expect(type).toEqual(mockType);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockType);
  });

  it('should create a new material type', () => {
    const newType = { name: 'Plastic' };
    const mockResponse: MaterialType = { id: 3, ...newType, unit: 'g', description: 'desc' };

    service.createMaterialType(newType).subscribe(type => {
      expect(type).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update a material type', () => {
    const updatedType = { name: 'Super Wood' };
    const mockResponse: MaterialType = { id: 1, ...updatedType, unit: 'm2', description: 'desc' };

    service.updateMaterialType(1, updatedType).subscribe(type => {
      expect(type).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a material type', () => {
    service.deleteMaterialType(1).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
}); 