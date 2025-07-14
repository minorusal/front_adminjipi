import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListadoMaterialesComponent } from './listado-materiales/listado-materiales.component';

const routes: Routes = [
  {
    path: '',
    component: ListadoMaterialesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaterialesRoutingModule { }
