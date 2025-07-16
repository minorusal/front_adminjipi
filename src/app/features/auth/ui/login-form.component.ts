import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  @Input() isLoading = false;
  @Output() login = new EventEmitter<{ email: string; password: string }>();

  readonly form = this.fb.group({
    email: [localStorage.getItem('loginEmail') || '', [Validators.required, Validators.email]],
    password: [localStorage.getItem('loginPassword') || '', [Validators.required, Validators.minLength(8)]],
  });

  constructor(private fb: FormBuilder) {
    this.form.valueChanges.subscribe(({ email, password }) => {
      localStorage.setItem('loginEmail', email ?? '');
      localStorage.setItem('loginPassword', password ?? '');
    });
  }

  onSubmit(): void {
    if (this.form.valid && !this.isLoading) {
      this.login.emit(this.form.getRawValue());
    }
  }
}
