import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SettingsPage } from '../features/settings/shell/settings.page';
import { VentasComponent } from './ventas/ventas.component';
import { ProductosComponent } from './productos/productos.component';
import { BodegasComponent } from './bodegas/bodegas.component';
<<<<<<< HEAD
=======
import { MaterialsPage } from '../features/materials/shell/materials.page';
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9
import { CotizacionesComponent } from './cotizaciones/cotizaciones.component';
import { AccessoriesPage } from '../features/accessories/shell/accessories.page';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'ventas', component: VentasComponent },
  { path: 'inventario/productos', component: ProductosComponent },
  { path: 'inventario/bodegas', component: BodegasComponent },
<<<<<<< HEAD
  { path: 'materiales', loadChildren: () => import('./materiales/materiales.module').then(m => m.MaterialesModule) },
  { path: 'cotizaciones', component: CotizacionesComponent },
  { path: 'accesorios/editar/:id', component: AccesoriosComponent },
  { path: 'accesorios', component: AccesoriosComponent },
  { path: 'settings', component: SettingsComponent },
=======
  { path: 'materiales', component: MaterialsPage },
  { path: 'cotizaciones', component: CotizacionesComponent },
  { path: 'accesorios/editar/:id', component: AccessoriesPage },
  { path: 'accesorios', component: AccessoriesPage },
  { path: 'settings', component: SettingsPage }
>>>>>>> 623efd667937a91c87fbe8fb2a7d690fdba176d9
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
