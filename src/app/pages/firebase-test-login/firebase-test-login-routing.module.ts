
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {
  FirebaseTestLoginPage
} from './firebase-test-login.page';

const routes: Routes = [
  {
    path: '',
    component: FirebaseTestLoginPage
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class FirebaseTestLoginPageRoutingModule {}
