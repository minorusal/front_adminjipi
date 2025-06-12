import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: any = {};
  open = false;

  ngOnInit() {
    const stored = localStorage.getItem('user');
    this.user = stored ? JSON.parse(stored) : {};
  }
}
