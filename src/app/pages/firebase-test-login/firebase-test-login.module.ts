
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular/lazy';
import { SharedModule } from '../../shared/shared.module';
import {
  FirebaseTestLoginPageRoutingModule
} from './firebase-test-login-routing.module';

import {
  FirebaseTestLoginPage
} from './firebase-test-login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FirebaseTestLoginPageRoutingModule,
    SharedModule
  ],
  declarations: [
    FirebaseTestLoginPage
  ]
})
export class FirebaseTestLoginPageModule {}
