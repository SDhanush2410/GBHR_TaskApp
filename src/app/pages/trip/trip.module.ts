
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { TripPageRoutingModule } from './trip-routing.module';
import { TripPage } from './trip.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TripPageRoutingModule,
      SharedModule,
  ],

  declarations: [
    TripPage
  ]

})
export class TripPageModule {}
