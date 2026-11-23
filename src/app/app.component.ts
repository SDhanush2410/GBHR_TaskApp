
import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular/lazy';

import { AttendanceNotificationService } from './services/attendance-notification.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {

  constructor(
    private platform: Platform,
    private notificationService: NotificationService,
    private attendanceNotificationService: AttendanceNotificationService
  ) {}

  async ngOnInit(): Promise<void> {

    // Wait until Ionic and Cordova are ready
    await this.platform.ready();

    // Initialize Firebase push notifications
    this.notificationService.initialize();

    // Check location when the application opens
    this.attendanceNotificationService.checkLocationStatus();

    // Check location again when returning from Android Settings
    this.platform.resume.subscribe(() => {

      console.log('Application resumed');

      this.attendanceNotificationService.checkLocationStatus();

    });

  }

}
