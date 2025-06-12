import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

  ngOnInit(): void {
    this.loadParentMenus();
    this.loadMenuTree();
  }

  loadParentMenus(): void {
    this.http
      .get<any[]>(`http://localhost:3000/menus/all?owner_id=${this.ownerId}`)
      .subscribe((menus) => (this.parentMenus = menus));
  }

  loadMenuTree(): void {
    this.http
      .get<any[]>(`http://localhost:3000/menus?owner_id=${this.ownerId}`)
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
    this.http.post('http://localhost:3000/menus', body).subscribe({
      next: () => {
        this.menuForm.reset();
        this.loadParentMenus();
        this.loadMenuTree();
      }
    });
  }
}
