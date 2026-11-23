
import { Injectable } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular/lazy';

@Injectable({
  providedIn: 'root'
})
export class AttendanceNotificationService {

  constructor(
    private platform: Platform,
    private alertController: AlertController
  ) {}

  // Access Cordova safely
  private get cordovaInstance(): any {
    return (window as any).cordova;
  }

  // Show local notification
  async showNotification(
    title: string,
    message: string
  ): Promise<void> {

    await this.platform.ready();

    const localNotification =
      this.cordovaInstance?.plugins?.notification?.local;

    if (!localNotification) {
      console.error('Local notification plugin is not available');
      return;
    }

    localNotification.schedule({
      id: Math.floor(Date.now() % 2147483647),
      title: title,
      text: message,
      androidChannelId: 'attendance_channel',
      androidChannelName: 'Attendance Notifications',
      androidChannelImportance: 'IMPORTANCE_HIGH',
      foreground: true,
      launch: true
    });
  }

  // Check-in success notification
  async checkInSuccess(): Promise<void> {
    await this.showNotification(
      'Attendance',
      'Check-in Saved Successfully'
    );
  }

  // Check-out success notification
  async checkOutSuccess(): Promise<void> {
    await this.showNotification(
      'Attendance',
      'Check-Out Saved Successfully'
    );
  }

  // Check whether device Location is enabled
  async isLocationEnabled(): Promise<boolean> {

    await this.platform.ready();

    const diagnostic =
      this.cordovaInstance?.plugins?.diagnostic;

    if (!diagnostic) {
      console.error('Diagnostic plugin is not available');
      return false;
    }

    return new Promise((resolve) => {

      diagnostic.isLocationEnabled(
        (enabled: boolean) => {
          resolve(enabled);
        },
        (error: any) => {
          console.error('Location check failed:', error);
          resolve(false);
        }
      );

    });
  }

  // Check Location and display notification and alert if OFF
  async checkLocationStatus(): Promise<void> {

    await this.platform.ready();

    const diagnostic =
      this.cordovaInstance?.plugins?.diagnostic;

    if (!diagnostic) {
      console.error('Diagnostic plugin is not available');
      return;
    }

    const enabled = await this.isLocationEnabled();

    if (!enabled) {

      await this.showNotification(
        'Location Required',
        'Please turn on your device location to save attendance records.'
      );

      const alert = await this.alertController.create({
        header: 'Location is Disabled',
        message: 'Please turn on your device location to save attendance records.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Open Settings',
            handler: () => {
              this.openLocationSettings();
            }
          }
        ]
      });

      await alert.present();

    } else {
      console.log('Device location is enabled');
    }
  }

  // Open Android Location Settings
  openLocationSettings(): void {

    const diagnostic =
      this.cordovaInstance?.plugins?.diagnostic;

    if (diagnostic) {
      diagnostic.switchToLocationSettings();
    } else {
      console.error('Diagnostic plugin is not available');
    }
  }

}
