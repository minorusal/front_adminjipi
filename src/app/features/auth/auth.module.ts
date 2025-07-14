import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { authRoutes } from './auth.routes';
import { AuthShellPage } from './shell/auth-shell.page';
import { AuthLoginPage } from './shell/auth-login.page';
import { LoginFormComponent } from './ui/login-form.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(authRoutes),
    LoginFormComponent,
  ],
  declarations: [AuthShellPage, AuthLoginPage],
})
export class AuthModule {}
