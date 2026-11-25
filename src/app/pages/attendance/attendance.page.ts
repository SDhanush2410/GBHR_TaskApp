import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {
  AlertController,
  LoadingController
} from '@ionic/angular/lazy';

import { AttendanceNotificationService } from '../../services/attendance-notification.service';

interface AttendanceRecord {
  id: number;
  employeeId: string;
  type: 'Check-in' | 'Check-out';
  dateTime: string;
  latitude: number;
  longitude: number;
  address: string;
  image: string;
}

interface AllowedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss'],
  standalone: false
})
export class AttendancePage implements OnInit {

  user: any = {};

  attendanceRecords: AttendanceRecord[] = [];

  isCapturing = false;

  selectedImage: string | null = null;

  currentAddress = 'Location not available';

  // ---------------------------------------
  // REGISTERED ATTENDANCE LOCATIONS
  // ---------------------------------------

  private readonly allowedLocations: AllowedLocation[] = [
    {
      name: 'Home',
      latitude: 13.116563861897482,
      longitude: 80.23882218385744
    },
    {
      name: 'Office',
      latitude: 13.052656966933386,
      longitude: 80.250198586193
    }
  ];

  // Allowed radius: 100 metres
  private readonly allowedRadius = 100;

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private attendanceNotificationService: AttendanceNotificationService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.loadEmployeeDetails();
  }

  ionViewWillEnter() {
    this.loadEmployeeDetails();
  }

  // ---------------------------------------
  // LOAD EMPLOYEE DETAILS
  // ---------------------------------------

  loadEmployeeDetails() {

    const storedUser = localStorage.getItem('userDetails');

    if (!storedUser) {
      this.router.navigate(['/login'], {
        replaceUrl: true
      });
      return;
    }

    try {

      this.user = JSON.parse(storedUser);

      this.loadAttendanceRecords();

    } catch (error) {

      console.error('Unable to load employee details:', error);

      this.router.navigate(['/login'], {
        replaceUrl: true
      });

    }
  }

  get employeeId(): string {
    return String(this.user?.EmployeeID || 'unknown');
  }

  get storageKey(): string {
    return `attendanceRecords_${this.employeeId}`;
  }

  // ---------------------------------------
  // NORMALIZE ATTENDANCE IMAGE
  // ---------------------------------------

  private normalizeImage(image: string): string {

    if (!image || typeof image !== 'string') {
      return '';
    }

    let imageData = image.trim();

    const mimeMatch = imageData.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,/i
    );

    const mimeType = mimeMatch
      ? mimeMatch[1].toLowerCase()
      : 'image/jpeg';

    while (
      /^data:image\/[^;]+;base64,/i.test(imageData)
    ) {
      imageData = imageData.replace(
        /^data:image\/[^;]+;base64,/i,
        ''
      );
    }

    imageData = imageData.replace(/\s/g, '');

    if (!imageData) {
      return '';
    }

    return `data:${mimeType};base64,${imageData}`;
  }

  // ---------------------------------------
  // LOAD ATTENDANCE HISTORY
  // ---------------------------------------

  loadAttendanceRecords() {
  if (!this.user?.EmployeeID) {
    return;
  }

  const savedRecords = localStorage.getItem(this.storageKey);

  try {
    const parsedRecords = savedRecords
      ? JSON.parse(savedRecords)
      : [];

    this.ngZone.run(() => {
      if (!Array.isArray(parsedRecords)) {
        this.attendanceRecords = [];
        this.currentAddress = 'Location not available';
        return;
      }

      this.attendanceRecords = parsedRecords.map(
        (record: AttendanceRecord) => ({
          ...record,
          image: this.normalizeImage(record.image)
        })
      );

      this.attendanceRecords.sort(
        (a, b) =>
          new Date(b.dateTime).getTime() -
          new Date(a.dateTime).getTime()
      );

      if (this.attendanceRecords.length > 0) {
        this.currentAddress =
          this.attendanceRecords[0].address ||
          'Location not available';
      } else {
        this.currentAddress = 'Location not available';
      }
    });

    // Keep the normalized records in storage.
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.attendanceRecords)
    );

    console.log(
      'Attendance records loaded:',
      this.attendanceRecords.length
    );

  } catch (error) {
    console.error('Unable to load attendance history:', error);

    this.ngZone.run(() => {
      this.attendanceRecords = [];
      this.currentAddress = 'Location not available';
    });
  }
}

  // ---------------------------------------
  // GET TODAY'S RECORDS
  // ---------------------------------------

  get todayRecords(): AttendanceRecord[] {

    const today = new Date().toDateString();

    return this.attendanceRecords
      .filter(record =>
        new Date(record.dateTime).toDateString() === today
      )
      .sort(
        (a, b) =>
          new Date(b.dateTime).getTime() -
          new Date(a.dateTime).getTime()
      );
  }

  // ---------------------------------------
  // GET LATEST TODAY'S RECORD
  // ---------------------------------------

  get latestTodayRecord(): AttendanceRecord | null {

    const records = this.todayRecords;

    return records.length > 0 ? records[0] : null;
  }

  // ---------------------------------------
  // CHECK NEXT ACTION
  // ---------------------------------------

  private isNextActionAllowed(
    type: 'Check-in' | 'Check-out'
  ): boolean {

    const latestRecord = this.latestTodayRecord;

    if (!latestRecord) {
      return type === 'Check-in';
    }

    if (latestRecord.type === 'Check-in') {
      return type === 'Check-out';
    }

    if (latestRecord.type === 'Check-out') {
      return type === 'Check-in';
    }

    return false;
  }

  // ---------------------------------------
  // CHECK-IN CONDITION
  // ---------------------------------------

  get canCheckIn(): boolean {

    return (
      !this.isCapturing &&
      this.isNextActionAllowed('Check-in')
    );
  }

  // ---------------------------------------
  // CHECK-OUT CONDITION
  // ---------------------------------------

  get canCheckOut(): boolean {

    return (
      !this.isCapturing &&
      this.isNextActionAllowed('Check-out')
    );
  }

  // ---------------------------------------
  // ATTENDANCE STATUS
  // ---------------------------------------

  get attendanceStatus(): string {

    if (!this.latestTodayRecord) {
      return 'Not Checked In';
    }

    if (this.latestTodayRecord.type === 'Check-in') {
      return 'Checked In';
    }

    return 'Checked Out';
  }

  // ---------------------------------------
  // CHECK-IN
  // ---------------------------------------

  checkIn() {

    if (!this.canCheckIn) {
      return;
    }

    this.captureAttendance('Check-in');
  }

  // ---------------------------------------
  // CHECK-OUT
  // ---------------------------------------

  checkOut() {

    if (!this.canCheckOut) {
      return;
    }

    this.captureAttendance('Check-out');
  }

  // ---------------------------------------
  // CALCULATE DISTANCE BETWEEN LOCATIONS
  // HAVERSINE FORMULA
  // ---------------------------------------

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {

    const earthRadius = 6371000;

    const toRadians = (degree: number) => {
      return degree * Math.PI / 180;
    };

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadius * c;
  }

  // ---------------------------------------
  // VERIFY GPS AGAINST HOME / OFFICE
  // ---------------------------------------

  private verifyAllowedLocation(
    latitude: number,
    longitude: number
  ): AllowedLocation | null {

    console.log('Current latitude:', latitude);
    console.log('Current longitude:', longitude);

    for (const location of this.allowedLocations) {

      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );

      console.log(
        `${location.name} distance: ${distance.toFixed(2)} metres`
      );

      if (distance <= this.allowedRadius) {

        console.log(
          `Location verified successfully: ${location.name}`
        );

        return location;
      }
    }

    return null;
  }

  // ---------------------------------------
  // WAIT FOR CORDOVA CAMERA
  // ---------------------------------------

  private waitForCordovaReady(): Promise<any> {

    return new Promise((resolve, reject) => {

      const camera = (window as any).navigator?.camera;

      if (
        camera &&
        typeof camera.getPicture === 'function'
      ) {
        resolve(camera);
        return;
      }

      const checkCamera = () => {

        const availableCamera =
          (window as any).navigator?.camera;

        if (
          availableCamera &&
          typeof availableCamera.getPicture === 'function'
        ) {

          clearTimeout(timeoutId);
          resolve(availableCamera);

        } else {

          clearTimeout(timeoutId);

          reject(
            new Error(
              'Camera plugin is not loaded. Please rebuild and reinstall the application.'
            )
          );

        }
      };

      const timeoutId = setTimeout(() => {

        document.removeEventListener(
          'deviceready',
          checkCamera
        );

        reject(
          new Error(
            'Camera plugin is not available after 15 seconds.'
          )
        );

      }, 15000);

      document.addEventListener(
        'deviceready',
        checkCamera,
        { once: true }
      );

    });
  }

  // ---------------------------------------
  // MAIN ATTENDANCE CAPTURE
  // GPS VERIFICATION FIRST, CAMERA SECOND
  // ---------------------------------------

  async captureAttendance(
    type: 'Check-in' | 'Check-out'
  ) {

    if (this.isCapturing) {
      return;
    }

    if (!this.isNextActionAllowed(type)) {

      await this.showAlert(
        'Invalid Attendance Action',
        type === 'Check-in'
          ? 'Please complete your previous check-out before checking in again.'
          : 'Please check in before checking out.'
      );

      return;
    }

    this.ngZone.run(() => {
  this.isCapturing = true;
});

    let loading: HTMLIonLoadingElement | null = null;

    try {

      console.log('STEP 1: Attendance process started');

      loading = await this.loadingController.create({
        message: 'Verifying your GPS location...',
        spinner: 'crescent',
        backdropDismiss: false
      });

      await loading.present();

      // -----------------------------------
      // STEP 1: CHECK DEVICE GPS
      // -----------------------------------

      const locationEnabled =
        await this.attendanceNotificationService.isLocationEnabled();

      if (!locationEnabled) {

        await loading.dismiss();
        loading = null;

        await this.attendanceNotificationService.checkLocationStatus();

        throw new Error(
          'Please enable your device GPS location and try again.'
        );
      }

      // -----------------------------------
      // STEP 2: GET CURRENT GPS LOCATION
      // -----------------------------------

      const position = await this.getCurrentLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log('STEP 2: GPS received');

      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      console.log('GPS accuracy:', position.coords.accuracy);

      // -----------------------------------
      // STEP 3: VERIFY HOME / OFFICE
      // -----------------------------------

      const verifiedLocation = this.verifyAllowedLocation(
        latitude,
        longitude
      );

      if (!verifiedLocation) {

        throw new Error(
          'Attendance denied!\n\n' +
          'Your current GPS location does not match your registered Home or Office location.\n\n' +
          'Please visit your registered location and try again.'
        );

      }

      console.log(
        'STEP 3: Location verified:',
        verifiedLocation.name
      );

      // -----------------------------------
      // STEP 4: GET CURRENT ADDRESS
      // -----------------------------------

      if (loading) {
        await loading.dismiss();
        loading = null;
      }

      const address = await this.getAddress(
        latitude,
        longitude
      );

      console.log('STEP 4: Address received:', address);

      // -----------------------------------
      // STEP 5: ONLY NOW OPEN CAMERA
      // -----------------------------------

      loading = await this.loadingController.create({
        message: 'Location verified. Opening camera...',
        spinner: 'crescent',
        backdropDismiss: false
      });

      await loading.present();

      const image = await this.capturePhoto();

      if (!image) {
        throw new Error('Attendance photograph is empty.');
      }

      console.log('STEP 5: Photograph captured');

      // -----------------------------------
      // STEP 6: CREATE ATTENDANCE RECORD
      // -----------------------------------

      const record: AttendanceRecord = {

        id: Date.now(),

        employeeId: this.employeeId,

        type: type,

        dateTime: new Date().toISOString(),

        latitude: latitude,

        longitude: longitude,

        address: address,

        image: this.normalizeImage(image)

      };

      // -----------------------------------
      // STEP 7: SAVE RECORD
      // -----------------------------------

      // Update the UI immediately inside Angular's zone.
this.ngZone.run(() => {
  this.attendanceRecords = [
    record,
    ...this.attendanceRecords
  ];

  this.currentAddress = address;

  // Save the updated list.
  localStorage.setItem(
    this.storageKey,
    JSON.stringify(this.attendanceRecords)
  );
});

console.log('Attendance record saved and UI updated.');

      console.log('STEP 6: Attendance saved');

      // -----------------------------------
      // STEP 8: NOTIFICATION
      // -----------------------------------

      if (type === 'Check-in') {

        await this.attendanceNotificationService.checkInSuccess();

      } else {

        await this.attendanceNotificationService.checkOutSuccess();

      }

      // -----------------------------------
      // STEP 9: SUCCESS MESSAGE
      // -----------------------------------

      await this.showAlert(
        'Success',
        `${type} completed successfully at ${verifiedLocation.name}!`
      );

    } catch (error: any) {

      console.error('Attendance capture error:', error);

      await this.showAlert(
        'Attendance Failed',
        error?.message ||
        'Unable to capture attendance. Please check camera and location permissions.'
      );

    } finally {
  if (loading) {
    await loading.dismiss().catch(() => {});
  }

  this.ngZone.run(() => {
    this.isCapturing = false;

    // Reload the saved list and refresh the history.
    this.loadAttendanceRecords();
  });

  console.log('Attendance process completed.');
}
  }

  // ---------------------------------------
  // CAMERA CAPTURE
  // ---------------------------------------

  async capturePhoto(): Promise<string> {

    const camera = await this.waitForCordovaReady();

    return new Promise((resolve, reject) => {

      camera.getPicture(

        (imageData: string) => {

          if (!imageData) {

            reject(
              new Error('No photograph was captured.')
            );

            return;
          }

          const imageUrl = this.normalizeImage(imageData);

          if (!imageUrl.startsWith('data:image/')) {

            reject(
              new Error('Invalid attendance image format.')
            );

            return;
          }

          console.log(
            'Camera image prefix:',
            imageUrl.substring(0, 50)
          );

          resolve(imageUrl);

        },

        (error: any) => {

          console.error('Camera error:', error);

          let message = 'Camera capture failed.';

          if (
            typeof error === 'string' &&
            error.toLowerCase().includes('permission')
          ) {

            message =
              'Camera permission denied. Please allow Camera permission in Android Settings.';

          } else if (
            typeof error === 'string' &&
            error.toLowerCase().includes('cancel')
          ) {

            message = 'Camera capture was cancelled.';

          }

          reject(new Error(message));

        },

        {
          quality: 40,
          destinationType: 0,
          sourceType: 1,
          encodingType: 0,
          mediaType: 0,
          correctOrientation: true,
          targetWidth: 640,
          targetHeight: 640,
          saveToPhotoAlbum: false,
          allowEdit: false
        }

      );

    });
  }

  // ---------------------------------------
  // GET CURRENT GPS LOCATION
  // ---------------------------------------

  getCurrentLocation(): Promise<any> {

    return new Promise((resolve, reject) => {

      if (!navigator.geolocation) {

        reject(
          new Error(
            'Geolocation is unavailable. Please check your Android application.'
          )
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(

        position => {
          resolve(position);
        },

        error => {

          console.error('Location error:', error);

          let message = 'Unable to get your current location.';

          if (error.code === error.PERMISSION_DENIED) {

            message =
              'Location permission denied. Please allow Location permission in Android Settings.';

          } else if (
            error.code === error.POSITION_UNAVAILABLE
          ) {

            message =
              'Location is unavailable. Please enable GPS on your phone.';

          } else if (error.code === error.TIMEOUT) {

            message =
              'Location request timed out. Please try again.';

          }

          reject(new Error(message));

        },

        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }

      );

    });
  }

  // ---------------------------------------
  // REVERSE GEOCODING
  // ---------------------------------------

  getAddress(
    latitude: number,
    longitude: number
  ): Promise<string> {

    return new Promise(resolve => {

      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

      this.http.get<any>(url).subscribe({

        next: response => {

          resolve(
            response.display_name ||
            'Address not available'
          );

        },

        error: error => {

          console.error('Address lookup failed:', error);

          resolve('Address not available');

        }

      });

    });
  }

  // ---------------------------------------
  // IMAGE PREVIEW
  // ---------------------------------------

  viewImage(image: string) {

    if (!image) {

      this.showAlert(
        'Image Not Available',
        'No attendance photograph was saved for this record.'
      );

      return;
    }

    const correctedImage = this.normalizeImage(image);

    if (!correctedImage) {

      this.showAlert(
        'Image Error',
        'The saved attendance photograph is invalid.'
      );

      return;
    }

    this.selectedImage = correctedImage;
  }

  closeImage() {
    this.selectedImage = null;
  }

  // ---------------------------------------
  // DATE FORMATTING
  // ---------------------------------------

  formatDate(dateTime: string): string {

    return new Date(dateTime).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  // ---------------------------------------
  // TIME FORMATTING
  // ---------------------------------------

  formatTime(dateTime: string): string {

    return new Date(dateTime).toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );
  }

  // ---------------------------------------
  // ALERT MESSAGE
  // ---------------------------------------

  async showAlert(
    header: string,
    message: string
  ) {

    const alert = await this.alertController.create({

      header: header,

      message: message.replace(/\n/g, '<br>'),

      buttons: ['OK']

    });

    await alert.present();
  }

}
