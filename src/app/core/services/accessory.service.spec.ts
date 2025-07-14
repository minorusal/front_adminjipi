import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccessoryService, Accessory, PaginatedResponse, AccessoryCreatePayload, AccessoryUpdatePayload, AccessoryTotals } from './accessory.service';
import { environment } from '../../environments/environment';

describe('AccessoryService', () => {
  let service: AccessoryService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/accessories`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccessoryService]
    });
    service = TestBed.inject(AccessoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  }); 

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get accessories with pagination', () => {
    const mockResponse: PaginatedResponse<Accessory> = {
      docs: [{ id: 1, name: 'Test Acc', description: 'Desc' }],
      totalDocs: 1, totalPages: 1, page: 1, limit: 10
    };
    const ownerId = 1;

    service.getAccessories(ownerId, 1, 10).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}?owner_id=${ownerId}&page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get accessory by ID', () => {
    const mockAccessory: Accessory = { id: 1, name: 'Test Acc', description: 'Desc' };
    const accessoryId = 1;

    service.getAccessoryById(accessoryId).subscribe(accessory => {
      expect(accessory).toEqual(mockAccessory);
    });

    const req = httpMock.expectOne(`${apiUrl}/${accessoryId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAccessory);
  });

  it('should create an accessory', () => {
    const payload: AccessoryCreatePayload = { /* ... mock payload ... */ } as any;
    const mockAccessory: Accessory = { id: 1, name: 'New Acc', description: 'New Desc' };

    service.createAccessoryDetailed(payload).subscribe(accessory => {
      expect(accessory).toEqual(mockAccessory);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockAccessory);
  });
  
  it('should update an accessory', () => {
    const accessoryId = 1;
    const payload: AccessoryUpdatePayload = { /* ... mock payload ... */ } as any;
    const mockAccessory: Accessory = { id: 1, name: 'Updated Acc', description: 'Updated Desc' };

    service.updateAccessoryDetailed(accessoryId, payload).subscribe(accessory => {
      expect(accessory).toEqual(mockAccessory);
    });

    const req = httpMock.expectOne(`${apiUrl}/${accessoryId}`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockAccessory);
  });

  it('should delete an accessory', () => {
    const accessoryId = 1;
    service.deleteAccessory(accessoryId).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${accessoryId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
  
  it('should get accessory totals', () => {
    const accessoryId = 1;
    const mockTotals: AccessoryTotals = {
      accessory_id: 1, accessory_name: 'Test', cost: 100, price: 150,
      profit_margin: 50, profit_percentage: 50
    };

    service.getAccessoryCost(accessoryId).subscribe(totals => {
      expect(totals).toEqual(mockTotals);
    });

    const req = httpMock.expectOne(`${apiUrl}/${accessoryId}/cost`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTotals);
  });
}); 