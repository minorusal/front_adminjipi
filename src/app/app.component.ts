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
    this.socketService.requestUnseenCount();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}
