import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';
import { VentasComponent } from './ventas/ventas.component';
import { ProductosComponent } from './productos/productos.component';
import { BodegasComponent } from './bodegas/bodegas.component';
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { AccesoriosComponent } from './accesorios/accesorios.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'ventas', component: VentasComponent },
  { path: 'inventario/productos', component: ProductosComponent },
  { path: 'inventario/bodegas', component: BodegasComponent },
  { path: 'materiales', loadChildren: () => import('./materiales/materiales.module').then(m => m.MaterialesModule) },
  { path: 'cotizaciones', component: CotizacionesComponent },
  { path: 'accesorios/editar/:id', component: AccesoriosComponent },
  { path: 'accesorios', component: AccesoriosComponent },
  { path: 'settings', component: SettingsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
