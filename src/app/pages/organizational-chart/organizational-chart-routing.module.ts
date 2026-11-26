import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrganizationalChartPage } from './organizational-chart.page';

const routes: Routes = [
  {
    path: '',
    component: OrganizationalChartPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationalChartPageRoutingModule {}
