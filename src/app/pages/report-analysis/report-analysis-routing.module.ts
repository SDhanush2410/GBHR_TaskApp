import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportAnalysisPage } from './report-analysis.page';

const routes: Routes = [
  {
    path: '',
    component: ReportAnalysisPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportAnalysisPageRoutingModule {}
