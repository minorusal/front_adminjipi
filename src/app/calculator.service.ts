import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CalculatorService {

  isConnected$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  errorMessage$: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);


  constructor(private socket: Socket) {
    this.checkStatus();
  }

  checkStatus() {
    this.socket.on('connect', () => {
      this.isConnected$.next(true);
      this.errorMessage$.next(null); // Restablece el mensaje de error
      console.log('Conectado al servidor de sockets');
    });

    this.socket.on('disconnect', () => {
      this.isConnected$.next(false);
      console.log('Desconectado del servidor de sockets');
    });

    this.socket.on('connect_error', (error: any) => {
      console.log(JSON.stringify(error));
      console.error('Error de conexión:', error);
      this.isConnected$.next(false);
      this.errorMessage$.next('Error de conexión: ' + error.message);
    });
  }

  connect() {
    this.socket.connect();
    // Manejar el evento de error de conexión
    this.socket.on('connect_error', (error: any) => {
      console.error('Error de conexión:', error.message);
      // Aquí puedes manejar el error como desees
    });
  }

  disconnect() {
    console.log('test1');
    this.socket.disconnect();
  }

  listen(event: string) {
    return this.socket.fromEvent(event);
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }
}
