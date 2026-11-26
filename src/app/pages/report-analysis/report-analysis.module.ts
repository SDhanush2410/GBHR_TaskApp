import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ReportAnalysisPageRoutingModule } from './report-analysis-routing.module';

import { ReportAnalysisPage } from './report-analysis.page';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReportAnalysisPageRoutingModule,
    SharedModule
  ],
  declarations: [ReportAnalysisPage]
})
export class ReportAnalysisPageModule {}
