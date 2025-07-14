import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RemissionService, Remission, PaginatedRemissions } from './remission.service';
import { environment } from '../../environments/environment';

describe('RemissionService', () => {
  let service: RemissionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/remissions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RemissionService]
    });
    service = TestBed.inject(RemissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get remissions with pagination', () => {
    const mockResponse: PaginatedRemissions = {
      docs: [{ id: 1 }],
      totalDocs: 1,
      limit: 10,
      page: 1,
      totalPages: 1
    };
    service.getRemissions(1, 10).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a remission by ID', () => {
    const mockRemission: Remission = { id: 1 };
    service.getRemissionById(1).subscribe(remission => {
      expect(remission).toEqual(mockRemission);
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRemission);
  });

  it('should create a remission', () => {
    const newRemission: Remission = { id: 0 }; // id will be assigned by backend
    const mockResponse: Remission = { id: 2 };
    service.createRemission(newRemission).subscribe(remission => {
      expect(remission).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update a remission', () => {
    const updatedRemission: Partial<Remission> = { };
    const mockResponse: Remission = { id: 1 };
    service.updateRemission(1, updatedRemission).subscribe(remission => {
      expect(remission).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a remission', () => {
    service.deleteRemission(1).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
}); 