import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsPage } from '../features/settings/shell/settings.page';
import { HomeComponent } from './home/home.component';
import { VentasComponent } from './ventas/ventas.component';
import { ProductosComponent } from './productos/productos.component';
import { BodegasComponent } from './bodegas/bodegas.component';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { MaterialsPage } from '../features/materials/shell/materials.page';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { AccessoriesPage } from '../features/accessories/shell/accessories.page';
import { CookieService } from './core/services/cookie.service';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SettingsPage,
    HomeComponent,
    VentasComponent,
    ProductosComponent,
    BodegasComponent,
    SidebarComponent,
    MaterialsPage,
    CotizacionesComponent,
    AccessoriesPage
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
