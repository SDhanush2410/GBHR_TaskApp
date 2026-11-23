
import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/lazy';

// Firebase Cordova plugin interface
declare const FirebasexMessaging: {
  grantPermission(
    success: (granted: boolean) => void,
    error: (error: any) => void
  ): void;

  getToken(
    success: (token: string | null) => void,
    error: (error: any) => void
  ): void;

  onTokenRefresh(
    success: (token: string) => void,
    error: (error: any) => void
  ): void;

  onMessageReceived(
    success: (message: any) => void,
    error: (error: any) => void
  ): void;
};

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private initialized = false;

  constructor(private platform: Platform) {}

  initialize(): void {

    // Wait until Cordova is ready
    this.platform.ready().then(() => {

      // Only execute on Cordova
      if (!this.platform.is('cordova')) {
        console.log('Not running on Cordova');
        return;
      }

      if (this.initialized) {
        return;
      }

      this.initialized = true;

      console.log('Initializing Firebase Notifications');

      // Listen for incoming notifications
      this.listenForNotifications();

      // Listen for FCM token changes
      this.listenForTokenRefresh();

      // Request notification permission
      this.requestPermission();

    });

  }

  // Request notification permission
  private requestPermission(): void {

    FirebasexMessaging.grantPermission(

      (granted: boolean) => {

        console.log('Notification Permission:', granted);

        if (granted) {

          console.log('Notification permission granted');

          this.getFCMToken();

        } else {

          console.log('Notification permission denied');

        }

      },

      (error: any) => {

        console.error('Permission Error:', error);

      }

    );

  }

  // Get Firebase registration token
  private getFCMToken(): void {

    FirebasexMessaging.getToken(

      (token: string | null) => {

        if (token) {

          this.saveFCMToken(token);

        } else {

          console.log('FCM token is not available yet');

        }

      },

      (error: any) => {

        console.error('FCM Token Error:', error);

      }

    );

  }

  // Listen for token changes
  private listenForTokenRefresh(): void {

    FirebasexMessaging.onTokenRefresh(

      (token: string) => {

        console.log('FCM Token Refreshed');

        this.saveFCMToken(token);

      },

      (error: any) => {

        console.error('Token Refresh Error:', error);

      }

    );

  }

  // Store or send token
  private saveFCMToken(token: string): void {

    console.log('================================');

    console.log('TASKAPP FCM TOKEN:');

    console.log(token);

    console.log('================================');

    // Later, send this token to your backend API.
    // Associate it with the currently logged-in user.

  }

  // Listen for incoming notifications
  private listenForNotifications(): void {

    FirebasexMessaging.onMessageReceived(

      (message: any) => {

        console.log('================================');

        console.log('TASKAPP NOTIFICATION RECEIVED');

        console.log(message);

        console.log('================================');

        // Check whether the user clicked the notification
        if (message.tap) {

          console.log(
            'Notification clicked:',
            message.tap
          );

          // Later, navigate to the corresponding task page.

        } else {

          // Foreground notification
          const title =
            message.notification?.title ||
            message.title ||
            'TaskApp Notification';

          const body =
            message.notification?.body ||
            message.body ||
            'You have a new notification';

          alert(title + '\n\n' + body);

        }

      },

      (error: any) => {

        console.error('Notification Receive Error:', error);

      }

    );

  }

}
