import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  LogFilesResponse,
  LogSearchResponse,
  LogSearchParams,
  LogTailOptions,
  LogEntry,
  LogFilters,
  CertificationLogSearchParams,
  CertificationLogSearchResponse
} from '../types/logs.types';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private defaultBaseUrl = `${environment.apiUrl}/api/certification/logs`;
  private tailEventSource: EventSource | null = null;
  private tailAbortController: AbortController | null = null;
  private tailSubject = new Subject<LogEntry>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private currentTailOptions: LogTailOptions | undefined;
  private currentBaseUrl: string | undefined;

  constructor(private http: HttpClient) {}

  /**
   * Get list of available log files
   */
  getLogFiles(page: number = 1, limit: number = 20, baseUrl?: string): Observable<LogFilesResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    const apiUrl = baseUrl ? `${baseUrl}/api/certification/logs` : this.defaultBaseUrl;
    return this.http.get<LogFilesResponse>(`${apiUrl}/files`, { params });
  }

  /**
   * Search certification logs using the new endpoint
   */
  searchCertificationLogs(searchParams: CertificationLogSearchParams, baseUrl?: string): Observable<CertificationLogSearchResponse> {
    console.log('🔥 searchCertificationLogs called with:', searchParams);
    console.log('🔥 baseUrl provided:', baseUrl);
    
    // Validate search parameters
    this.validateCertificationSearchParams(searchParams);

    let params = new HttpParams()
      .set('from', searchParams.from)
      .set('to', searchParams.to)
      .set('q', searchParams.query)
      .set('limit', searchParams.limit.toString());

    if (searchParams.level) {
      params = params.set('level', searchParams.level);
    }
    
    if (searchParams.maxFiles) {
      params = params.set('max_files', searchParams.maxFiles.toString());
    }

    const apiUrl = baseUrl || environment.apiUrl;
    const fullUrl = `${apiUrl}/api/certification/logs/search`;
    console.log('🔥 Full URL being called:', fullUrl);
    console.log('🔥 HTTP params being sent:', params.toString());
    
    const token = localStorage.getItem('sessionToken');
    const mcToken = localStorage.getItem('mcToken');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (mcToken) {
      headers['mc-token'] = `Bearer ${mcToken}`;
    }

    console.log('🔥 Headers being sent:', headers);

    return this.http.get<CertificationLogSearchResponse>(fullUrl, { 
      params,
      headers 
    });
  }

  /**
   * Validate certification search parameters
   */
  private validateCertificationSearchParams(params: CertificationLogSearchParams): void {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.from) || !dateRegex.test(params.to)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Validate date range
    const fromDate = new Date(params.from);
    const toDate = new Date(params.to);
    if (fromDate > toDate) {
      throw new Error('La fecha de inicio debe ser menor que la fecha de fin');
    }

    // Validate that range is not too wide (max 30 days)
    const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      throw new Error('El rango máximo es de 30 días');
    }

    // Validate limit
    if (params.limit < 1 || params.limit > 5000) {
      throw new Error('El límite debe estar entre 1 y 5000');
    }

    // Validate maxFiles if provided
    if (params.maxFiles && (params.maxFiles < 1 || params.maxFiles > 3)) {
      throw new Error('El número máximo de archivos debe estar entre 1 y 3');
    }

    // Validate search query is not empty
    if (!params.query || params.query.trim().length === 0) {
      throw new Error('El término de búsqueda no puede estar vacío');
    }
  }

  /**
   * Get logs by specific date
   */
  getLogsByDate(date: string, filters?: LogFilters, baseUrl?: string): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters?.level && filters.level !== 'all') {
      params = params.set('level', filters.level);
    }
    if (filters?.searchTerm) {
      params = params.set('search', filters.searchTerm);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    const apiUrl = baseUrl ? `${baseUrl}/api/certification/logs` : this.defaultBaseUrl;
    return this.http.get(`${apiUrl}/${date}`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Download compressed logs for a specific date
   */
  downloadLogs(date: string, filters?: LogFilters, baseUrl?: string): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters?.level && filters.level !== 'all') {
      params = params.set('level', filters.level);
    }
    if (filters?.searchTerm) {
      params = params.set('search', filters.searchTerm);
    }

    const apiUrl = baseUrl ? `${baseUrl}/api/certification/logs` : this.defaultBaseUrl;
    return this.http.get(`${apiUrl}/${date}/download`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Search logs across multiple days
   */
  searchLogs(searchParams: LogSearchParams, baseUrl?: string): Observable<CertificationLogSearchResponse> {
    console.log('⚠️ WARNING: searchLogs (standard) called with:', searchParams);
    console.log('⚠️ This should NOT be called for certification logs!');
    
    let params = new HttpParams();
    
    // Map parameters correctly for certification logs endpoint
    Object.keys(searchParams).forEach(key => {
      const value = searchParams[key as keyof LogSearchParams];
      if (value !== null && value !== undefined && value !== '') {
        // Map the parameter names to what the API expects
        let paramName = key;
        if (key === 'startDate') paramName = 'from';
        if (key === 'endDate') paramName = 'to';
        if (key === 'search') paramName = 'q';
        if (key === 'format') return; // Skip format parameter
        
        params = params.append(paramName, value.toString());
      }
    });

    const apiUrl = baseUrl ? `${baseUrl}/api/certification/logs` : this.defaultBaseUrl;
    const fullUrl = `${apiUrl}/search`;
    console.log('⚠️ Standard search URL:', fullUrl);
    console.log('⚠️ Standard search params (FIXED):', params.toString());
    
    return this.http.get(fullUrl, { params, responseType: 'text' }).pipe(
      map((textResponse: string) => {
        console.log('🔥 Raw text response:', textResponse);
        
        // Parse concatenated JSON objects
        const logs: any[] = [];
        
        // Split by newline first, then by }{, since each JSON object is on a new line
        const lines = textResponse.trim().split('\n');
        
        lines.forEach((line, index) => {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line.trim());
              logs.push(parsed);
              console.log(`🔥 Successfully parsed line ${index + 1}:`, parsed);
            } catch (e) {
              console.warn(`Failed to parse line ${index + 1}:`, line);
              
              // Fallback: try the original split method
              try {
                const jsonObjects = line.trim().split('}{');
                jsonObjects.forEach((obj, objIndex) => {
                  let jsonStr = obj;
                  if (objIndex > 0) jsonStr = '{' + jsonStr;
                  if (objIndex < jsonObjects.length - 1) jsonStr = jsonStr + '}';
                  
                  const parsed = JSON.parse(jsonStr);
                  logs.push(parsed);
                });
              } catch (e2) {
                console.warn('Complete parsing failure for line:', line);
              }
            }
          }
        });
        
        console.log('🔥 Parsed logs:', logs);
        
        return {
          success: true,
          data: {
            logs: logs,
            total: logs.length,
            executionTime: 0,
            filesSearched: []
          }
        } as CertificationLogSearchResponse;
      })
    );
  }

  /**
   * Start real-time tail functionality using fetch() with proper headers
   */
  startTail(options?: LogTailOptions, baseUrl?: string): Observable<LogEntry> {
    this.stopTail(); // Stop any existing tail
    this.currentTailOptions = options;
    this.currentBaseUrl = baseUrl;
    this.reconnectAttempts = 0;

    const url = this.buildTailUrlWithoutAuth(options, baseUrl);
    console.log('Connecting to SSE with fetch:', url);

    // Use fetch instead of EventSource to send proper headers
    this.startFetchStream(url);

    return this.tailSubject.asObservable();
  }

  /**
   * Start streaming using fetch() with proper headers
   */
  private async startFetchStream(url: string): Promise<void> {
    try {
      // Create abort controller for cancellation
      this.tailAbortController = new AbortController();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'mc-token': `Bearer ${environment.genericToken}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        signal: this.tailAbortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      console.log('SSE fetch connection opened successfully');
      this.reconnectAttempts = 0; // Reset on successful connection

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('SSE stream ended');
          this.handleStreamEnd();
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        console.log('Received lines:', lines.length);
        
        for (const line of lines) {
          if (line.trim()) {
            console.log('Processing non-empty line:', line.substring(0, 100) + '...');
            this.processSSELine(line);
          }
        }
      }
    } catch (error) {
      console.error('Fetch stream error:', error);
      
      // Don't try to reconnect if manually stopped
      if (this.tailAbortController?.signal.aborted) {
        console.log('Stream was manually stopped, not attempting reconnection');
        return;
      }
      
      this.handleStreamError(error);
    }
  }

  /**
   * Process individual SSE line
   */
  private processSSELine(line: string): void {
    console.log('Processing line:', line);

    // Case 1: Non-standard format "event: messagedata: {json}"
    const nonStandardMatch = line.match(/^event: message(?:id: \d+)?data: (.*)/);
    if (nonStandardMatch && nonStandardMatch[1]) {
      const data = nonStandardMatch[1];
      try {
        const logEntry: LogEntry = JSON.parse(data);
        console.log('Parsed non-standard log entry:', logEntry);
        this.tailSubject.next(logEntry);
      } catch (error) {
        console.error('Error parsing non-standard SSE data (JSON invalid):', error, 'Line:', line);
      }
      return; // Handled this line
    }

    // Case 2: Standard "data: {json}" line
    if (line.startsWith('data: ')) {
      try {
        const data = line.substring(6); // Remove "data: " prefix
        console.log('Extracted standard data:', data);
        
        if (data.trim()) {
          const parsedData = JSON.parse(data);
          let logEntry: LogEntry;

          if (parsedData.line) {
            // Backend sends {"line": "actual log content", "timestamp": "..."}
            const parsedLineContent = this.parseLogEntry(parsedData.line);
            logEntry = {
              timestamp: parsedData.timestamp || (parsedLineContent ? parsedLineContent.timestamp : new Date().toISOString()),
              level: parsedData.level || (parsedLineContent ? parsedLineContent.level : 'info'),
              message: parsedLineContent ? parsedLineContent.message : parsedData.line,
              raw: parsedData.line,
              meta: parsedData.meta
            };
          } else if (parsedData.timestamp && parsedData.message) {
            // Already in LogEntry format
            logEntry = parsedData as LogEntry;
          } else {
            // Generic JSON object
            logEntry = {
              timestamp: parsedData.timestamp || new Date().toISOString(),
              level: parsedData.level || 'info',
              message: parsedData.message || JSON.stringify(parsedData),
              raw: data // Use the raw data string if no specific message field
            };
          }
          console.log('Final standard log entry:', logEntry);
          this.tailSubject.next(logEntry);
        }
      } catch (error) {
        console.error('Error parsing standard SSE data (JSON invalid):', error, 'Line:', line);
      }
      return; // Handled this line
    }

    // Case 3: Ignore other standard SSE protocol lines (event:, id:, comments)
    if (line.startsWith('event:') || line.startsWith('id:') || line.startsWith(':')) {
      console.log('Ignoring standard SSE protocol line:', line);
      return;
    }

    // Case 4: Fallback for raw JSON or plain text (original logic for lines not matching SSE format)
    if (line.trim()) {
      console.log('Attempting fallback parsing for line:', line);
      try {
        const parsed = JSON.parse(line);
        let logEntry: LogEntry;
        if (parsed.line) {
          logEntry = this.parseLogEntry(parsed.line) || {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: parsed.line,
            raw: parsed.line
          };
        } else if (parsed.timestamp && parsed.message) {
          logEntry = parsed as LogEntry;
        } else {
          logEntry = {
            timestamp: parsed.timestamp || new Date().toISOString(),
            level: parsed.level || 'info',
            message: parsed.message || JSON.stringify(parsed),
            raw: line
          };
        }
        console.log('Parsed fallback JSON entry:', logEntry);
        this.tailSubject.next(logEntry);
      } catch (error) {
        const simpleEntry = this.parseLogEntry(line);
        if (simpleEntry) {
          console.log('Parsed fallback simple entry:', simpleEntry);
          this.tailSubject.next(simpleEntry);
        } else {
          console.log('Could not parse line:', line);
        }
      }
    }
  }

  /**
   * Handle stream end (natural termination)
   */
  private handleStreamEnd(): void {
    console.log('Stream ended naturally, attempting reconnection...');
    this.attemptReconnection();
  }

  /**
   * Handle stream error
   */
  private handleStreamError(error: any): void {
    console.error('Stream error occurred:', error);
    
    // Emit error if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, giving up');
      this.tailSubject.error(error);
      return;
    }
    
    this.attemptReconnection();
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnection(): void {
    if (!this.currentTailOptions) {
      console.log('No tail options saved, cannot reconnect');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.currentTailOptions) {
        const url = this.buildTailUrlWithoutAuth(this.currentTailOptions, this.currentBaseUrl);
        this.startFetchStream(url);
      }
    }, delay);
  }

  /**
   * Stop real-time tail functionality
   */
  stopTail(): void {
    console.log('Stopping tail connection');
    this.currentTailOptions = undefined;
    this.currentBaseUrl = undefined;
    this.reconnectAttempts = 0;

    // Stop EventSource if using legacy method
    if (this.tailEventSource) {
      this.tailEventSource.close();
      this.tailEventSource = null;
    }

    // Stop fetch stream if using new method
    if (this.tailAbortController) {
      this.tailAbortController.abort();
      this.tailAbortController = null;
    }
  }

  /**
   * Get current tail status
   */
  isTailActive(): boolean {
    return (this.tailEventSource !== null && this.tailEventSource.readyState === EventSource.OPEN) ||
           (this.tailAbortController !== null && !this.tailAbortController.signal.aborted);
  }

  /**
   * Helper method to download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format date for API calls
   */
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse log entry from raw text
   */
  parseLogEntry(rawLine: string): LogEntry | null {
    if (!rawLine || !rawLine.trim()) return null;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawLine);
      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level || 'info',
        message: parsed.message || rawLine,
        meta: parsed.meta,
        raw: rawLine
      };
    } catch {
      // If not JSON, try to extract timestamp and level from text
      const timestampMatch = rawLine.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
      const levelMatch = rawLine.match(/\[(DEBUG|INFO|WARN|ERROR|FATAL)\]/i) || 
                        rawLine.match(/\b(DEBUG|INFO|WARN|ERROR|FATAL)\b/i);
      
      // Extract message (remove timestamp and level if found)
      let message = rawLine;
      if (timestampMatch) {
        message = message.replace(timestampMatch[0], '').trim();
      }
      if (levelMatch) {
        message = message.replace(levelMatch[0], '').trim();
      }
      
      return {
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        level: levelMatch ? levelMatch[1].toLowerCase() : 'info',
        message: message || rawLine,
        raw: rawLine
      };
    }
  }

  /**
   * Get log level color for UI
   */
  getLogLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'debug': return 'text-muted';
      case 'info': return 'text-info';
      case 'warn': return 'text-warning';
      case 'error': return 'text-danger';
      case 'fatal': return 'text-danger fw-bold';
      default: return 'text-secondary';
    }
  }

  /**
   * Get log level badge class
   */
  getLogLevelBadge(level: string): string {
    switch (level.toLowerCase()) {
      case 'debug': return 'bg-secondary';
      case 'info': return 'bg-info';
      case 'warn': return 'bg-warning';
      case 'error': return 'bg-danger';
      case 'fatal': return 'bg-dark';
      default: return 'bg-light text-dark';
    }
  }

  /**
   * Get authentication token for SSE connection
   */
  private getAuthToken(): string | null {
    // Use the same generic token as other API endpoints
    return environment.genericToken;
  }

  /**
   * Build SSE URL without authentication (auth will be sent in headers via fetch)
   */
  private buildTailUrlWithoutAuth(options?: LogTailOptions, baseUrl?: string): string {
    const apiUrl = baseUrl ? `${baseUrl}/api/certification/logs` : this.defaultBaseUrl;
    let url = `${apiUrl}/tail`;
    const params = new URLSearchParams();

    // Add tail options only (no authentication in URL)
    if (options?.lines) params.append('lines', options.lines.toString());
    if (options?.follow !== false) params.append('follow', 'true');
    if (options?.level) params.append('level', options.level);
    if (options?.search) params.append('search', options.search);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return url;
  }
}