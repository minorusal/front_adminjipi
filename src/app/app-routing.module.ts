import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  // Show the login component when the root path is visited
  { path: '', component: LoginComponent, pathMatch: 'full' },

  // Alias to access the login using '/login'
  { path: 'login', component: LoginComponent },

  { path: 'dashboard', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
