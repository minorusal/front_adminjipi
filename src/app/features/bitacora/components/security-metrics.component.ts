import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BitacoraService } from '../services/bitacora.service';
import {
  SecurityMetrics,
  SuspiciousActivity,
  IpAnalysis,
  SecurityAlerts
} from '../types/bitacora.types';

@Component({
  selector: 'app-security-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row">
      <!-- Security Overview Cards -->
      <div class="col-12 mb-4">
        <div class="row" *ngIf="securityOverview">
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-info shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                      Unique IPs
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ securityOverview.total_unique_ips | number }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-globe fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-warning shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Suspicious IPs
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ securityOverview.suspicious_ips_count | number }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-danger shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                      Failed Auth Attempts
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ securityOverview.failed_auth_attempts | number }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-user-slash fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-success shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Blocked Requests
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                      {{ securityOverview.blocked_requests | number }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="fas fa-shield-alt fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Suspicious Activity -->
      <div class="col-xl-8 col-lg-7">
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 class="m-0 font-weight-bold text-primary">Actividad Sospechosa</h6>
            <div class="dropdown no-arrow">
              <select class="form-select form-select-sm" 
                      [(ngModel)]="selectedRiskLevel"
                      (change)="loadSuspiciousActivity()">
                <option value="">Todos los niveles</option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Risk Level</th>
                    <th>Requests</th>
                    <th>Error Rate</th>
                    <th>Risk Score</th>
                    <th>Last Seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let activity of suspiciousActivities">
                    <td>
                      <code>{{ activity.ip_address }}</code>
                      <br>
                      <small class="text-muted" *ngIf="activity.geographic_location">
                        {{ activity.geographic_location }}
                      </small>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': activity.risk_level === 'low',
                        'bg-warning': activity.risk_level === 'medium',
                        'bg-danger': activity.risk_level === 'high',
                        'bg-dark': activity.risk_level === 'critical'
                      }">{{ activity.risk_level | titlecase }}</span>
                    </td>
                    <td>{{ activity.request_count | number }}</td>
                    <td>
                      <span [class]="getErrorRateClass(activity.error_rate)">
                        {{ activity.error_rate | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td>
                      <span class="font-weight-bold" [class]="getRiskScoreClass(activity.risk_score)">
                        {{ activity.risk_score | number:'1.0-0' }}
                      </span>
                    </td>
                    <td>
                      <small>{{ activity.last_seen | date:'short' }}</small>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" 
                              (click)="analyzeIp(activity.ip_address)"
                              title="Analizar IP">
                        <i class="fas fa-search"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Alerts -->
      <div class="col-xl-4 col-lg-5">
        <div class="card shadow mb-4">
          <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Alertas de Seguridad</h6>
          </div>
          <div class="card-body">
            <div class="security-alert mb-3" *ngFor="let alert of securityAlerts">
              <div class="d-flex align-items-center">
                <div class="mr-3">
                  <div class="icon-circle" [ngClass]="{
                    'bg-success': alert.severity === 'low',
                    'bg-warning': alert.severity === 'medium',
                    'bg-danger': alert.severity === 'high',
                    'bg-dark': alert.severity === 'critical'
                  }">
                    <i class="fas fa-exclamation-triangle text-white"></i>
                  </div>
                </div>
                <div class="flex-grow-1">
                  <div class="small text-gray-500">{{ alert.timestamp | date:'short' }}</div>
                  <div class="font-weight-bold">{{ alert.alert_type }}</div>
                  <div class="small">{{ alert.description }}</div>
                  <div class="small text-muted" *ngIf="alert.ip_address">
                    IP: {{ alert.ip_address }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- IP Analysis Modal -->
      <div *ngIf="showIpAnalysis && selectedIpData" class="modal fade show d-block" 
           tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-search me-2"></i>
                Análisis de IP: {{ selectedIpData.ip_address }}
              </h5>
              <button type="button" class="btn-close" (click)="closeIpAnalysis()"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Estadísticas Generales</h6>
                  <table class="table table-sm">
                    <tr>
                      <td><strong>Total Requests:</strong></td>
                      <td>{{ selectedIpData.total_requests | number }}</td>
                    </tr>
                    <tr>
                      <td><strong>Unique Users:</strong></td>
                      <td>{{ selectedIpData.unique_users | number }}</td>
                    </tr>
                    <tr>
                      <td><strong>Error Rate:</strong></td>
                      <td>{{ selectedIpData.error_rate | number:'1.1-1' }}%</td>
                    </tr>
                    <tr>
                      <td><strong>Avg Response:</strong></td>
                      <td>{{ selectedIpData.avg_response_time | number }}ms</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Información Geográfica</h6>
                  <div *ngIf="selectedIpData.geographic_info">
                    <p><strong>País:</strong> {{ selectedIpData.geographic_info.country }}</p>
                    <p><strong>Ciudad:</strong> {{ selectedIpData.geographic_info.city }}</p>
                    <p><strong>Región:</strong> {{ selectedIpData.geographic_info.region }}</p>
                  </div>
                  <div *ngIf="!selectedIpData.geographic_info">
                    <p class="text-muted">No hay información geográfica disponible</p>
                  </div>
                </div>
              </div>
              
              <div class="row mt-3">
                <div class="col-12">
                  <h6>Indicadores de Amenaza</h6>
                  <div class="d-flex flex-wrap gap-2">
                    <span class="badge" 
                          [class]="selectedIpData.threat_indicators.high_frequency ? 'bg-danger' : 'bg-success'">
                      High Frequency: {{ selectedIpData.threat_indicators.high_frequency ? 'Yes' : 'No' }}
                    </span>
                    <span class="badge" 
                          [class]="selectedIpData.threat_indicators.multiple_users ? 'bg-warning' : 'bg-success'">
                      Multiple Users: {{ selectedIpData.threat_indicators.multiple_users ? 'Yes' : 'No' }}
                    </span>
                    <span class="badge" 
                          [class]="selectedIpData.threat_indicators.error_prone ? 'bg-danger' : 'bg-success'">
                      Error Prone: {{ selectedIpData.threat_indicators.error_prone ? 'Yes' : 'No' }}
                    </span>
                    <span class="badge" 
                          [class]="selectedIpData.threat_indicators.unusual_patterns ? 'bg-warning' : 'bg-success'">
                      Unusual Patterns: {{ selectedIpData.threat_indicators.unusual_patterns ? 'Yes' : 'No' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="row mt-3" *ngIf="selectedIpData.user_agents.length > 0">
                <div class="col-12">
                  <h6>User Agents</h6>
                  <div class="user-agents-list" style="max-height: 200px; overflow-y: auto;">
                    <div *ngFor="let ua of selectedIpData.user_agents" class="small text-muted mb-1">
                      {{ ua }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeIpAnalysis()">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .border-left-info {
      border-left: 0.25rem solid #36b9cc !important;
    }
    .border-left-warning {
      border-left: 0.25rem solid #f6c23e !important;
    }
    .border-left-danger {
      border-left: 0.25rem solid #e74a3b !important;
    }
    .border-left-success {
      border-left: 0.25rem solid #1cc88a !important;
    }
    .text-xs {
      font-size: 0.7rem;
    }
    .icon-circle {
      width: 2rem;
      height: 2rem;
      border-radius: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .security-alert {
      border-bottom: 1px solid #e3e6f0;
      padding-bottom: 1rem;
    }
    .security-alert:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .user-agents-list {
      background-color: #f8f9fc;
      padding: 10px;
      border-radius: 4px;
    }
  `]
})
export class SecurityMetricsComponent implements OnInit, OnChanges {
  @Input() apiUrl?: string;
  
  securityOverview: SecurityMetrics | null = null;
  suspiciousActivities: SuspiciousActivity[] = [];
  securityAlerts: SecurityAlerts[] = [];
  selectedIpData: IpAnalysis | null = null;
  showIpAnalysis = false;
  selectedRiskLevel = '';
  loading = false;
  error: string | null = null;

  constructor(private bitacoraService: BitacoraService) {}

  ngOnInit() {
    this.loadAllData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['apiUrl'] && !changes['apiUrl'].firstChange) {
      this.loadAllData();
    }
  }

  private loadAllData() {
    this.loadSecurityMetrics();
    this.loadSuspiciousActivity();
    this.loadSecurityAlerts();
  }

  loadSecurityMetrics() {
    this.bitacoraService.getSecurityMetrics({}, this.apiUrl).subscribe({
      next: (response) => {
        if (response.ok) {
          this.securityOverview = response.data;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar métricas de seguridad';
        console.error('Security metrics error:', err);
      }
    });
  }

  loadSuspiciousActivity() {
    const params = this.selectedRiskLevel ? { risk_level: this.selectedRiskLevel, limit: 20 } : { limit: 20 };
    
    this.bitacoraService.getSuspiciousActivity(params, this.apiUrl).subscribe({
      next: (response) => {
        if (response.ok) {
          this.suspiciousActivities = response.data;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar actividad sospechosa';
        console.error('Suspicious activity error:', err);
      }
    });
  }

  loadSecurityAlerts() {
    this.bitacoraService.getSecurityAlerts({ limit: 10, status: 'new' }, this.apiUrl).subscribe({
      next: (response) => {
        if (response.ok) {
          this.securityAlerts = response.data;
        }
      },
      error: (err) => {
        this.error = 'Error al cargar alertas de seguridad';
        console.error('Security alerts error:', err);
      }
    });
  }

  analyzeIp(ipAddress: string) {
    this.loading = true;
    this.bitacoraService.getIpAnalysis({ ip_address: ipAddress }, this.apiUrl).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.ok && response.data.length > 0) {
          this.selectedIpData = response.data[0];
          this.showIpAnalysis = true;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al analizar IP';
        console.error('IP analysis error:', err);
      }
    });
  }

  closeIpAnalysis() {
    this.showIpAnalysis = false;
    this.selectedIpData = null;
  }

  getErrorRateClass(errorRate: number): string {
    if (errorRate > 20) return 'text-danger fw-bold';
    if (errorRate > 10) return 'text-warning';
    return 'text-success';
  }

  getRiskScoreClass(riskScore: number): string {
    if (riskScore > 80) return 'text-danger';
    if (riskScore > 60) return 'text-warning';
    if (riskScore > 40) return 'text-info';
    return 'text-success';
  }
}