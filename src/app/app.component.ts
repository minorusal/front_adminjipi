import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './core/socket/socket.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private readonly socketService: SocketService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.socketService.requestList();
    const to_user_id = 102;
    this.socketService.requestUnseenCount(to_user_id);
    this.http
      .get<any[]>(`${environment.apiUrl}/api/notifications`, {
        params: { page: 1, limit: 20 },
      })
      .subscribe((list) => this.socketService.notifications$.next(list));
    this.http
      .get<any>(`${environment.apiUrl}/api/notifications/unseen-count`)
      .subscribe((resp) =>
        this.socketService.badge$.next(resp?.count ?? resp ?? 0)
      );
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}
