import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { OrganizationalChartPageRoutingModule } from './organizational-chart-routing.module';

import { OrganizationalChartPage } from './organizational-chart.page';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrganizationalChartPageRoutingModule,
    SharedModule
  ],
  declarations: [OrganizationalChartPage]
})
export class OrganizationalChartPageModule {}
