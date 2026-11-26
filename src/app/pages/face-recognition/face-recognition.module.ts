import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { FaceRecognitionPageRoutingModule } from './face-recognition-routing.module';

import { FaceRecognitionPage } from './face-recognition.page';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FaceRecognitionPageRoutingModule,SharedModule
  ],
  declarations: [FaceRecognitionPage]
})
export class FaceRecognitionPageModule {}
