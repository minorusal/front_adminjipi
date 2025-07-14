import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService, Project, PaginatedResponse } from './project.service';
import { environment } from '../../environments/environment';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/projects`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService]
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get projects with pagination', () => {
    const mockResponse: PaginatedResponse<Project> = { items: [{ id: 1, name: 'Project 1' }], total: 1, page: 1, limit: 10 };
    service.getProjects(1, 10).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a project by ID', () => {
    const mockProject: Project = { id: 1, name: 'Project 1' };
    service.getProjectById(1).subscribe(project => {
      expect(project).toEqual(mockProject);
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProject);
  });

  it('should create a project', () => {
    const newProject: Project = { id: 0, name: 'New Project' }; // id will be assigned by backend
    const mockResponse: Project = { id: 2, name: 'New Project' };
    service.createProject(newProject).subscribe(project => {
      expect(project).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should update a project', () => {
    const updatedProject: Partial<Project> = { name: 'Updated Project' };
    const mockResponse: Project = { id: 1, name: 'Updated Project' };
    service.updateProject(1, updatedProject).subscribe(project => {
      expect(project).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('should delete a project', () => {
    service.deleteProject(1).subscribe(res => {
      expect(res).toBeNull();
    });
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should download a project PDF', () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    service.downloadProjectPdf(1).subscribe(blob => {
      expect(blob).toEqual(mockBlob);
      expect(blob.type).toBe('application/pdf');
    });
    const req = httpMock.expectOne(`${apiUrl}/1/pdf`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });
}); 