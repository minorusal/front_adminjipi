import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialesRoutingModule } from './materiales-routing.module';
import { MaterialesComponent } from './materiales.component';
import { ListadoMaterialesComponent } from './listado-materiales/listado-materiales.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MaterialesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialesComponent,
    ListadoMaterialesComponent
  ]
})
export class MaterialesModule { }
