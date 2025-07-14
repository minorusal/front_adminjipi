import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MaterialService, PaginatedMaterials } from './material.service';

@Injectable({
  providedIn: 'root'
})
export class MaterialStateService {
  private paginatedMaterialsSubject = new BehaviorSubject<PaginatedMaterials>({
    docs: [],
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    limit: 10
  });
  private errorSubject = new BehaviorSubject<string | null>(null);

  paginatedMaterials$: Observable<PaginatedMaterials> = this.paginatedMaterialsSubject.asObservable();
  error$: Observable<string | null> = this.errorSubject.asObservable();

  constructor(private materialService: MaterialService) {}

  loadMaterials(page: number, limit: number, search?: string): void {
    this.materialService.getMaterials(page, limit, search).pipe(
      tap(response => {
        this.paginatedMaterialsSubject.next(response);
        this.errorSubject.next(null);
      }),
      catchError(error => {
        const errorMessage = 'Failed to load materials';
        console.error(errorMessage, error);
        this.errorSubject.next(errorMessage);
        return [];
      })
    ).subscribe({
      error: () => {
        // El error ya se maneja en catchError,
        // esta suscripción vacía previene que se propague a la consola.
      }
    });
  }
} 