import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  menuForm: FormGroup;
  parentMenus: any[] = [];
  menuTree: any[] = [];
  private ownerId = 1;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.menuForm = this.fb.group({
      name: [''],
      url: [''],
      parent: ['']
    });
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  ngOnInit(): void {
    this.loadParentMenus();
    this.loadMenuTree();
  }

  loadParentMenus(): void {
    const token = this.getCookie('token');
    const options = token ? { headers: new HttpHeaders({ token }) } : {};
    this.http
      .get<any[]>(`http://localhost:3000/menus/all?owner_id=${this.ownerId}`, options)
      .subscribe((menus) => (this.parentMenus = menus));
  }

  loadMenuTree(): void {
    const token = this.getCookie('token');
    const options = token ? { headers: new HttpHeaders({ token }) } : {};
    this.http
      .get<any[]>(`http://localhost:3000/menus?owner_id=${this.ownerId}`, options)
      .subscribe((tree) => (this.menuTree = tree));
  }

  onSubmit(): void {
    const { name, url, parent } = this.menuForm.value;
    const body = {
      name,
      path: url || null,
      parent_id: parent || null,
      owner_id: this.ownerId
    };
    const token = this.getCookie('token');
    const options = token ? { headers: new HttpHeaders({ token }) } : {};
    this.http.post('http://localhost:3000/menus', body, options).subscribe({
      next: () => {
        this.menuForm.reset();
        this.loadParentMenus();
        this.loadMenuTree();
      }
    });
  }
}
