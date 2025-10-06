import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { environment as environmentProd } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-cron-diagnostics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-4">
      <h2 class="mb-4">
        <i class="fas fa-bug me-2"></i>
        Diagnóstico de Cron Jobs
      </h2>

      <!-- Selector de Ambiente -->
      <div class="card mb-4">
        <div class="card-header">
          <h5>Configuración</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">Ambiente</label>
              <select class="form-select" [(ngModel)]="selectedEnvironment">
                <option value="qa">QA</option>
                <option value="prod">Prod</option>
              </select>
              <small class="text-muted">Base URL: {{ getCurrentBaseUrl() }}</small>
            </div>
            <div class="col-md-6">
              <label class="form-label">Job ID</label>
              <input type="text" class="form-control" [(ngModel)]="jobId" placeholder="Ej: JOB006">
            </div>
          </div>
        </div>
      </div>

      <!-- Test 1: Listar Jobs -->
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h5>Test 1: GET /api/cron/jobs</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-primary" (click)="testGetJobs()">
            <i class="fas fa-play me-1"></i> Ejecutar
          </button>
          <div *ngIf="test1Response" class="mt-3">
            <h6>Respuesta:</h6>
            <pre class="bg-light p-3 rounded">{{ test1Response | json }}</pre>
          </div>
        </div>
      </div>

      <!-- Test 2: Ejecutar Job -->
      <div class="card mb-4">
        <div class="card-header bg-success text-white">
          <h5>Test 2: POST /api/cron/jobs/{{jobId}}/execute</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-success" (click)="testExecuteJob()" [disabled]="!jobId">
            <i class="fas fa-play me-1"></i> Ejecutar Job
          </button>
          <div *ngIf="test2Response" class="mt-3">
            <h6>Respuesta:</h6>
            <pre class="bg-light p-3 rounded">{{ test2Response | json }}</pre>
          </div>
        </div>
      </div>

      <!-- Test 3: Consultar Ejecuciones -->
      <div class="card mb-4">
        <div class="card-header bg-info text-white">
          <h5>Test 3: GET /api/cron/executions?jobId={{jobId}}&limit=10&offset=0</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-info" (click)="testGetExecutions()" [disabled]="!jobId">
            <i class="fas fa-search me-1"></i> Consultar Ejecuciones
          </button>
          <div *ngIf="test3Response" class="mt-3">
            <h6>Respuesta:</h6>
            <pre class="bg-light p-3 rounded">{{ test3Response | json }}</pre>

            <div class="alert alert-info mt-3" *ngIf="test3Response.ok">
              <strong>Total de ejecuciones:</strong> {{ test3Response.data?.total || 0 }}<br>
              <strong>Ejecuciones retornadas:</strong> {{ test3Response.data?.executions?.length || 0 }}
            </div>

            <div *ngIf="test3Response.data?.executions?.length > 0" class="mt-3">
              <h6>Últimas Ejecuciones:</h6>
              <table class="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Job ID</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Inicio</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exec of test3Response.data.executions">
                    <td>{{ exec.log_id }}</td>
                    <td>{{ exec.job_id }}</td>
                    <td>{{ exec.execution_type }}</td>
                    <td>
                      <span [class]="'badge bg-' + getStatusBadge(exec.status)">
                        {{ exec.status }}
                      </span>
                    </td>
                    <td>{{ exec.start_time }}</td>
                    <td>{{ exec.duration_ms }}ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Test 4: Estadísticas del Job -->
      <div class="card mb-4">
        <div class="card-header bg-warning">
          <h5>Test 4: GET /api/cron/jobs/{{jobId}}/stats</h5>
        </div>
        <div class="card-body">
          <button class="btn btn-warning" (click)="testGetStats()" [disabled]="!jobId">
            <i class="fas fa-chart-bar me-1"></i> Obtener Estadísticas
          </button>
          <div *ngIf="test4Response" class="mt-3">
            <h6>Respuesta:</h6>
            <pre class="bg-light p-3 rounded">{{ test4Response | json }}</pre>
          </div>
        </div>
      </div>

      <!-- Test Completo -->
      <div class="card mb-4 border-danger">
        <div class="card-header bg-danger text-white">
          <h5>🔥 Test Completo: Ejecutar + Esperar + Consultar</h5>
        </div>
        <div class="card-body">
          <p>Este test ejecutará el job y luego consultará las ejecuciones con diferentes tiempos de espera.</p>
          <button class="btn btn-danger" (click)="testCompleto()" [disabled]="!jobId || isRunningFullTest">
            <i class="fas fa-bolt me-1"></i> Ejecutar Test Completo
          </button>

          <div *ngIf="fullTestLogs.length > 0" class="mt-3">
            <h6>Log del Test:</h6>
            <div class="bg-dark text-light p-3 rounded" style="max-height: 400px; overflow-y: auto;">
              <div *ngFor="let log of fullTestLogs" [class.text-success]="log.includes('✅')"
                   [class.text-danger]="log.includes('❌')"
                   [class.text-warning]="log.includes('⏱️')">
                {{ log }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Instrucciones -->
      <div class="alert alert-info">
        <h5><i class="fas fa-info-circle me-2"></i>Instrucciones</h5>
        <ol>
          <li>Selecciona el ambiente (QA o Prod)</li>
          <li>Ingresa el Job ID (ej: JOB006)</li>
          <li>Ejecuta el <strong>Test Completo</strong></li>
          <li>Revisa los logs para ver si las ejecuciones aparecen</li>
          <li>Si no aparecen, copia y envía toda la respuesta para reportar el problema al backend</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    pre {
      max-height: 400px;
      overflow-y: auto;
      font-size: 0.875rem;
    }
  `]
})
export class CronDiagnosticsComponent {
  selectedEnvironment: 'qa' | 'prod' = 'qa';
  qaApiUrl: string = environment.apiUrl;
  prodApiUrl: string = environmentProd.apiUrl;
  jobId: string = 'JOB006';

  test1Response: any = null;
  test2Response: any = null;
  test3Response: any = null;
  test4Response: any = null;

  fullTestLogs: string[] = [];
  isRunningFullTest = false;

  constructor(private http: HttpClient) {}

  getCurrentBaseUrl(): string {
    return this.selectedEnvironment === 'qa' ? this.qaApiUrl : this.prodApiUrl;
  }

  testGetJobs(): void {
    const url = `${this.getCurrentBaseUrl()}/api/cron/jobs`;
    console.log('🔍 Test 1 - Consultando:', url);

    this.http.get(url).subscribe({
      next: (response) => {
        console.log('✅ Test 1 - Respuesta:', response);
        this.test1Response = response;
      },
      error: (error) => {
        console.error('❌ Test 1 - Error:', error);
        this.test1Response = { error: true, message: error.message, details: error };
      }
    });
  }

  testExecuteJob(): void {
    const url = `${this.getCurrentBaseUrl()}/api/cron/jobs/${this.jobId}/execute`;
    console.log('🚀 Test 2 - Ejecutando:', url);

    this.http.post(url, {}).subscribe({
      next: (response) => {
        console.log('✅ Test 2 - Respuesta:', response);
        this.test2Response = response;
      },
      error: (error) => {
        console.error('❌ Test 2 - Error:', error);
        this.test2Response = { error: true, message: error.message, details: error };
      }
    });
  }

  testGetExecutions(): void {
    const url = `${this.getCurrentBaseUrl()}/api/cron/executions?jobId=${this.jobId}&limit=10&offset=0`;
    console.log('🔍 Test 3 - Consultando:', url);

    this.http.get(url).subscribe({
      next: (response) => {
        console.log('✅ Test 3 - Respuesta:', response);
        this.test3Response = response;
      },
      error: (error) => {
        console.error('❌ Test 3 - Error:', error);
        this.test3Response = { error: true, message: error.message, details: error };
      }
    });
  }

  testGetStats(): void {
    const url = `${this.getCurrentBaseUrl()}/api/cron/jobs/${this.jobId}/stats`;
    console.log('📊 Test 4 - Consultando:', url);

    this.http.get(url).subscribe({
      next: (response) => {
        console.log('✅ Test 4 - Respuesta:', response);
        this.test4Response = response;
      },
      error: (error) => {
        console.error('❌ Test 4 - Error:', error);
        this.test4Response = { error: true, message: error.message, details: error };
      }
    });
  }

  async testCompleto(): Promise<void> {
    this.isRunningFullTest = true;
    this.fullTestLogs = [];

    const baseUrl = this.getCurrentBaseUrl();
    const addLog = (msg: string) => {
      this.fullTestLogs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };

    try {
      // Paso 1: Consultar ejecuciones antes
      addLog('📋 Consultando ejecuciones ANTES de ejecutar...');
      const beforeUrl = `${baseUrl}/api/cron/executions?jobId=${this.jobId}&limit=5&offset=0`;
      const beforeResponse: any = await this.http.get(beforeUrl).toPromise();
      const beforeCount = beforeResponse.data?.executions?.length || 0;
      addLog(`✅ Ejecuciones ANTES: ${beforeCount}`);

      // Paso 2: Ejecutar job
      addLog('🚀 Ejecutando job manualmente...');
      const executeUrl = `${baseUrl}/api/cron/jobs/${this.jobId}/execute`;
      const executeResponse: any = await this.http.post(executeUrl, {}).toPromise();
      addLog(`✅ Job ejecutado: ${executeResponse.success ? 'ÉXITO' : 'FALLÓ'}`);
      addLog(`   Duración: ${executeResponse.duracion_segundos}s`);
      addLog(`   Mensaje: ${executeResponse.mensaje}`);

      // Paso 3: Esperar 2 segundos
      addLog('⏱️ Esperando 2 segundos...');
      await this.delay(2000);

      // Paso 4: Consultar ejecuciones después (1er intento)
      addLog('📋 Consultando ejecuciones DESPUÉS (2s)...');
      const after2sUrl = `${baseUrl}/api/cron/executions?jobId=${this.jobId}&limit=5&offset=0`;
      const after2sResponse: any = await this.http.get(after2sUrl).toPromise();
      const after2sCount = after2sResponse.data?.executions?.length || 0;
      addLog(`✅ Ejecuciones DESPUÉS (2s): ${after2sCount}`);

      if (after2sCount > beforeCount) {
        addLog('✅ ¡LA EJECUCIÓN APARECIÓ! El frontend está funcionando correctamente.');
      } else {
        addLog('⚠️ La ejecución NO apareció después de 2s. Esperando 3 segundos más...');

        // Paso 5: Esperar 3 segundos adicionales
        await this.delay(3000);

        // Paso 6: Consultar ejecuciones después (2do intento)
        addLog('📋 Consultando ejecuciones DESPUÉS (5s total)...');
        const after5sUrl = `${baseUrl}/api/cron/executions?jobId=${this.jobId}&limit=5&offset=0`;
        const after5sResponse: any = await this.http.get(after5sUrl).toPromise();
        const after5sCount = after5sResponse.data?.executions?.length || 0;
        addLog(`✅ Ejecuciones DESPUÉS (5s): ${after5sCount}`);

        if (after5sCount > beforeCount) {
          addLog('✅ ¡LA EJECUCIÓN APARECIÓ! El frontend está funcionando correctamente (necesitó 5s).');
        } else {
          addLog('❌ PROBLEMA DETECTADO: La ejecución NO aparece después de 5 segundos.');
          addLog('❌ Esto indica que el problema está en el BACKEND.');
          addLog('📋 Recomendación: Reportar al equipo de backend que las ejecuciones no se están guardando correctamente en la tabla.');
        }
      }

      // Paso 7: Mostrar detalles de las ejecuciones
      addLog('');
      addLog('📊 Detalles de las últimas ejecuciones:');
      const finalResponse: any = await this.http.get(`${baseUrl}/api/cron/executions?jobId=${this.jobId}&limit=5&offset=0`).toPromise();
      if (finalResponse.data?.executions) {
        finalResponse.data.executions.forEach((exec: any, index: number) => {
          addLog(`   ${index + 1}. Log ID: ${exec.log_id} | Tipo: ${exec.execution_type} | Estado: ${exec.status} | ${exec.start_time}`);
        });
      }

      this.test3Response = finalResponse;

    } catch (error: any) {
      addLog(`❌ ERROR: ${error.message}`);
      console.error('Error en test completo:', error);
    } finally {
      this.isRunningFullTest = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      'SUCCESS': 'success',
      'ERROR': 'danger',
      'STARTED': 'warning'
    };
    return badges[status] || 'secondary';
  }
}
