import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';
import { ReactiveFormsModule } from '@angular/forms';
import { ComponentPageRoutingModule } from './component-routing.module';
import { ComponentPage } from './component.page';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentPageRoutingModule,
    ReactiveFormsModule,
    SharedModule
  ],
  declarations: [ComponentPage]
})
export class ComponentPageModule {}