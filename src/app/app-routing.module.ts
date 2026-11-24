
import { NgModule } from '@angular/core';
import {
  PreloadAllModules,
  RouterModule,
  Routes
} from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module')
        .then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module')
        .then(m => m.HomePageModule)
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./pages/profile/profile.module')
        .then(m => m.ProfilePageModule)
  },
  {
    path: 'attendance',
    loadChildren: () =>
      import('./pages/attendance/attendance.module')
        .then(m => m.AttendancePageModule)
  },
  {
    path: '',
    redirectTo: () =>
      localStorage.getItem('userDetails')
        ? '/home'
        : '/login',
    pathMatch: 'full'
  },
  {
    path: 'component',
    loadChildren: () => 
      import('./pages/component/component.module')
        .then( m => m.ComponentPageModule)
  },
  {
    path: 'trip',
    loadChildren: () => 
      import('./pages/trip/trip.module')
        .then( m => m.TripPageModule)
  },
  {
    path: 'chat',
    loadChildren: () => 
      import('./pages/chat/chat.module')
        .then( m => m.ChatPageModule)
  },
  {
    path: 'firebase-test-login',
    loadChildren: () => 
      import('./pages/firebase-test-login/firebase-test-login.module')
        .then( m => m.FirebaseTestLoginPageModule)
  },
  {
    path: '**',
    redirectTo: 'login'
  },

  
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
