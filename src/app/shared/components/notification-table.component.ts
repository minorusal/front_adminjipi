import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../core/socket/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table class="table table-sm mb-0">
      <thead>
        <tr>
          <th>Título</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let n of notifications$ | async">
          <td [class.fw-bold]="!n.seen">{{ n.title }}</td>
          <td>{{ n.date }}</td>
          <td>
            <button (click)="markSeen(n.uuid)" class="btn btn-sm btn-link">Marcar vista</button>
            <button (click)="delete(n.uuid)" class="btn btn-sm btn-link text-danger">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationTableComponent implements OnInit, OnDestroy {
  readonly notifications$ = this.socketService.notifications$;
  private subscription = new Subscription();

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.notifications$.subscribe((list) =>
        console.log('NotificationTableComponent: notifications', list)
      )
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  markSeen(uuid: string): void {
    this.socketService.markSeen(uuid);
  }

  delete(uuid: string): void {
    this.socketService.delete(uuid);
  }
}
