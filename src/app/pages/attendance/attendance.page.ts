
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  AlertController,
  LoadingController
} from '@ionic/angular/lazy';

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

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController
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

      console.error(
        'Unable to load employee details:',
        error
      );

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

    // Identify the original image MIME type.
    const mimeMatch = imageData.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,/i
    );

    const mimeType = mimeMatch
      ? mimeMatch[1].toLowerCase()
      : 'image/jpeg';

    // Remove all repeated image data URL prefixes.
    while (
      /^data:image\/[^;]+;base64,/i.test(imageData)
    ) {
      imageData = imageData.replace(
        /^data:image\/[^;]+;base64,/i,
        ''
      );
    }

    // Remove unwanted whitespace.
    imageData = imageData.replace(/\s/g, '');

    if (!imageData) {
      return '';
    }

    // Return exactly one valid data URL prefix.
    return `data:${mimeType};base64,${imageData}`;
  }

  // ---------------------------------------
  // LOAD ATTENDANCE HISTORY
  // ---------------------------------------

  loadAttendanceRecords() {

    if (!this.user?.EmployeeID) {
      return;
    }

    const savedRecords = localStorage.getItem(
      this.storageKey
    );

    try {

      const parsedRecords = savedRecords
        ? JSON.parse(savedRecords)
        : [];

      if (!Array.isArray(parsedRecords)) {
        this.attendanceRecords = [];
        return;
      }

      // Normalize every saved image.
      this.attendanceRecords = parsedRecords.map(
        (record: AttendanceRecord) => ({
          ...record,
          image: this.normalizeImage(record.image)
        })
      );

      // Sort newest attendance first.
      this.attendanceRecords.sort(
        (a, b) =>
          new Date(b.dateTime).getTime() -
          new Date(a.dateTime).getTime()
      );

      // Save corrected image URLs and records.
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.attendanceRecords)
      );

      if (this.attendanceRecords.length > 0) {

        this.currentAddress =
          this.attendanceRecords[0].address ||
          'Location not available';

      } else {

        this.currentAddress = 'Location not available';
      }

      console.log(
        'Attendance records loaded:',
        this.attendanceRecords.length
      );

    } catch (error) {

      console.error(
        'Unable to load attendance history:',
        error
      );

      this.attendanceRecords = [];
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
  // CHECK WHETHER ACTION IS ALLOWED
  // ---------------------------------------

  private isNextActionAllowed(
    type: 'Check-in' | 'Check-out'
  ): boolean {

    const latestRecord = this.latestTodayRecord;

    // First attendance action of the day.
    if (!latestRecord) {
      return type === 'Check-in';
    }

    // After Check-in, only Check-out is allowed.
    if (latestRecord.type === 'Check-in') {
      return type === 'Check-out';
    }

    // After Check-out, another Check-in is allowed.
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
  // WAIT FOR CORDOVA CAMERA
  // ---------------------------------------

  private waitForCordovaReady(): Promise<any> {

    return new Promise((resolve, reject) => {

      const camera =
        (window as any).navigator?.camera;

      if (
        camera &&
        typeof camera.getPicture === 'function'
      ) {
        resolve(camera);
        return;
      }

      let timeoutId: any;

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

      document.addEventListener(
        'deviceready',
        checkCamera,
        { once: true }
      );

      timeoutId = setTimeout(() => {

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

    });
  }

  // ---------------------------------------
  // CAPTURE ATTENDANCE
  // ---------------------------------------

  async captureAttendance(
    type: 'Check-in' | 'Check-out'
  ) {

    if (this.isCapturing) {
      return;
    }

    // IMPORTANT:
    // Validate before setting isCapturing to true.
    // Do not use canCheckIn/canCheckOut after changing
    // isCapturing because those getters include that flag.

    if (!this.isNextActionAllowed(type)) {

      await this.showAlert(
        'Invalid Attendance Action',
        type === 'Check-in'
          ? 'Please complete your previous check-out before checking in again.'
          : 'Please check in before checking out.'
      );

      return;
    }

    this.isCapturing = true;

    let loading: HTMLIonLoadingElement | null = null;

    try {

      console.log('STEP 1: Attendance process started');
      console.log('Attendance type:', type);

      loading = await this.loadingController.create({
        message: 'Capturing attendance...',
        spinner: 'crescent'
      });

      await loading.present();

      // STEP 1: Capture photograph.
      const image = await this.capturePhoto();

      if (!image) {
        throw new Error('Attendance photograph is empty.');
      }

      console.log('STEP 2: Camera callback received');
      console.log('Image length:', image.length);
      console.log('Image prefix:', image.substring(0, 50));

      // STEP 2: Get current GPS location.
      const position = await this.getCurrentLocation();

      console.log('STEP 3: Location received');

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // STEP 3: Get address from GPS coordinates.
      const address = await this.getAddress(
        latitude,
        longitude
      );

      console.log('STEP 4: Address received:', address);

      // STEP 4: Create attendance record.
      const record: AttendanceRecord = {

        id: Date.now(),

        employeeId: this.employeeId,

        type: type,

        dateTime: new Date().toISOString(),

        latitude: latitude,

        longitude: longitude,

        address: address,

        // Store normalized image with one prefix.
        image: this.normalizeImage(image)
      };

      // STEP 5: Add the latest record.
      this.attendanceRecords.unshift(record);

      // STEP 6: Save records in localStorage.
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.attendanceRecords)
      );

      console.log('STEP 5: Attendance saved');

      console.log(
        'Saved record count:',
        this.attendanceRecords.length
      );

      console.log(
        'Saved image prefix:',
        record.image.substring(0, 50)
      );

      this.currentAddress = address;

      // STEP 7: Show success message.
      await this.showAlert(
        'Success',
        `${type} completed successfully!`
      );

    } catch (error: any) {

      console.error(
        'Attendance capture error:',
        error
      );

      await this.showAlert(
        'Attendance Failed',
        error?.message ||
        'Unable to capture attendance. Please check camera and location permissions.'
      );

    } finally {

      if (loading) {
        await loading.dismiss().catch(() => {});
      }

      this.isCapturing = false;

      // Refresh saved attendance history.
      this.loadAttendanceRecords();

      console.log(
        'Attendance process completed.'
      );
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

          // Camera may return a complete DATA_URL
          // or only the Base64 image data.
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
            'Geolocation plugin is unavailable. Please check the Android application.'
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

          let message =
            'Unable to get your current location.';

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

          console.error(
            'Address lookup failed:',
            error
          );

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

    console.log(
      'Selected image length:',
      correctedImage.length
    );

    console.log(
      'Selected image prefix:',
      correctedImage.substring(0, 100)
    );

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

      message: message,

      buttons: ['OK']

    });

    await alert.present();
  }

}
