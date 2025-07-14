import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { authRoutes } from './auth.routes';
import { AuthShellPage } from './shell/auth-shell.page';

@NgModule({
  imports: [CommonModule, RouterModule.forChild(authRoutes)],
  declarations: [AuthShellPage],
})
export class AuthModule {}
