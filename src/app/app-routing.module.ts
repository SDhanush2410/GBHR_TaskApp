
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
    path: 'face-recognition',
    loadChildren: () => 
      import('./pages/face-recognition/face-recognition.module')
        .then( m => m.FaceRecognitionPageModule)
  },

  {
    path: 'reports',
    loadChildren: () => 
      import('./pages/reports/reports.module')
        .then( m => m.ReportsPageModule)
  },
  {
    path: 'report-analysis',
    loadChildren: () => 
      import('./pages/report-analysis/report-analysis.module')
        .then( m => m.ReportAnalysisPageModule)
  },

  {
    path: 'organizational-chart',
    loadChildren: () =>
       import('./pages/organizational-chart/organizational-chart.module')
        .then( m => m.OrganizationalChartPageModule)
  },
  {
    path: 'forms',
    loadChildren: () => 
      import('./pages/forms/forms.module')
        .then( m => m.FormsPageModule)
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
