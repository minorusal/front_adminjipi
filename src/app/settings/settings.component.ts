import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  menuForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.menuForm = this.fb.group({
      name: [''],
      url: [''],
      parent: ['']
    });
  }

  onSubmit(): void {
    console.log(this.menuForm.value);
  }
}
