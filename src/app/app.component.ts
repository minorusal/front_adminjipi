import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './core/socket/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(private readonly socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.socketService.requestList();
    const to_user_id = 102;
    this.socketService.requestUnseenCount(to_user_id);
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}
