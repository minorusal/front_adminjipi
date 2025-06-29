import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
import { HomeComponent } from './home/home.component';
import { VentasComponent } from './ventas/ventas.component';
import { ProductosComponent } from './productos/productos.component';
import { BodegasComponent } from './bodegas/bodegas.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ListadoMaterialesComponent } from './listado-materiales/listado-materiales.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { AccesoriosComponent } from './accesorios/accesorios.component';
import { CookieService } from './services/cookie.service';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    SettingsComponent,
    HomeComponent,
    VentasComponent,
    ProductosComponent,
    BodegasComponent,
    SidebarComponent,
    ListadoMaterialesComponent,
    CotizacionesComponent,
    AccesoriosComponent
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
