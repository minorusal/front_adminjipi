import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsPage } from '../features/settings/shell/settings.page';
import { HomeComponent } from './home/home.component';
import { VentasComponent } from './ventas/ventas.component';
import { ProductosComponent } from './productos/productos.component';
import { BodegasComponent } from './bodegas/bodegas.component';
<<<<<<< HEAD
import { SidebarComponent } from './sidebar/sidebar.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { AccesoriosComponent } from './accesorios/accesorios.component';
import { CookieService } from './services/cookie.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
=======
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { MaterialsPage } from '../features/materials/shell/materials.page';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { AccessoriesPage } from '../features/accessories/shell/accessories.page';
import { CookieService } from './core/services/cookie.service';
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9

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
<<<<<<< HEAD
=======
    MaterialsPage,
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9
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
  providers: [
    CookieService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
