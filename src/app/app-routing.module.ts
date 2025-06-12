import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  // Route to access the login directly
  { path: 'login', component: LoginComponent },

  // Route to the dashboard after successful login
  { path: 'dashboard', component: DashboardComponent },

  // Redirect the root path to the login page
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Redirect any unknown route to the login page
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
