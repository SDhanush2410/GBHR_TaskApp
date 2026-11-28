
import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {
  AlertController,
  LoadingController
} from '@ionic/angular';

import { firstValueFrom } from 'rxjs';

type SecureSection = 'bank' | 'id' | 'contact';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit, OnDestroy {

  employee: any = {};

  // Secure card visibility
  bankDetailsVisible = false;
  idProofVisible = false;
  contactVisible = false;

  // Independent countdown for each card
  bankTimer = 0;
  idTimer = 0;
  contactTimer = 0;

  // Timer references
  private secureTimers: Partial<
    Record<SecureSection, ReturnType<typeof setInterval>>
  > = {};

  // Login API
  private apiUrl =
    'https://gbhermes.in/EdgeHRMSmobileApp/api/Values/Login';

  // Dummy Bank Details
  bankDetails = {
    BankName: 'HDFC Bank',
    AccountHolder: 'Sample Employee',
    AccountNumber: '123456789012',
    IFSCCode: 'HDFC0001234',
    Branch: 'Chennai Main Branch'
  };

  // Dummy ID Proof Details
  idProofDetails = {
    AadhaarNumber: '123456789012',
    PANNumber: 'ABCDE1234F'
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadEmployeeDetails();
  }

  // ==========================================
  // LOAD EMPLOYEE DETAILS
  // ==========================================

  loadEmployeeDetails() {

    const storedData = localStorage.getItem('userDetails');

    if (!storedData) {

      this.router.navigate(['/login'], {
        replaceUrl: true
      });

      return;
    }

    try {

      this.employee = JSON.parse(storedData);

    } catch (error) {

      console.error(
        'Unable to load employee details:',
        error
      );

      localStorage.removeItem('userDetails');

      this.router.navigate(['/login'], {
        replaceUrl: true
      });
    }
  }

  // ==========================================
  // EMPLOYEE NAME
  // ==========================================

  get employeeName(): string {

    const firstName = this.employee.FirstName || '';
    const middleName = this.employee.MiddleName || '';
    const lastName = this.employee.LastName || '';

    return `${firstName} ${middleName} ${lastName}`
      .replace(/\s+/g, ' ')
      .trim() || 'Employee';
  }

  // ==========================================
  // CURRENT ADDRESS
  // ==========================================

  get currentAddress(): string {

    return [
      this.employee.CAddress1,
      this.employee.CAddress2,
      this.employee.CAddress3,
      this.employee.CAddress4,
      this.employee.CPincode
    ]
      .filter(value => value)
      .join(', ') || 'Not provided';
  }

  // ==========================================
  // PERMANENT ADDRESS
  // ==========================================

  get permanentAddress(): string {

    return [
      this.employee.PAddress1,
      this.employee.PAddress2,
      this.employee.PAddress3,
      this.employee.PAddress4,
      this.employee.PPincode
    ]
      .filter(value => value)
      .join(', ') || 'Not provided';
  }

  // ==========================================
  // DATE FORMAT
  // ==========================================

  formatDate(date: string): string {

    if (!date) {
      return 'Not provided';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  // ==========================================
  // MASK MOBILE NUMBER
  // ==========================================

  maskMobile(mobile: string): string {

    if (!mobile) {
      return 'Not provided';
    }

    const value = String(mobile);

    if (value.length <= 4) {
      return 'XXXX';
    }

    return 'XXXXXX' + value.slice(-4);
  }

  // ==========================================
  // MASK EMAIL
  // ==========================================

  maskEmail(email: string): string {

    if (!email) {
      return 'Not provided';
    }

    const parts = String(email).split('@');

    if (parts.length !== 2) {
      return 'XXXXXXXX';
    }

    const username = parts[0];
    const domain = parts[1];

    return username.charAt(0) +
      'XXXXXX@' + domain;
  }

  // ==========================================
  // MASK ACCOUNT NUMBER
  // ==========================================

  maskAccountNumber(accountNumber: string): string {

    if (!accountNumber) {
      return 'Not provided';
    }

    const value = String(accountNumber);

    return 'XXXX XXXX ' + value.slice(-4);
  }

  // ==========================================
  // MASK AADHAAR
  // ==========================================

  maskAadhaar(aadhaar: string): string {

    if (!aadhaar) {
      return 'Not provided';
    }

    return 'XXXX XXXX ' + String(aadhaar).slice(-4);
  }

  // ==========================================
  // MASK PAN
  // ==========================================

  maskPAN(pan: string): string {

    if (!pan) {
      return 'Not provided';
    }

    const value = String(pan);

    return 'XXXXX' + value.slice(-5);
  }

  // ==========================================
  // OPEN PASSWORD POPUP
  // ==========================================

  async viewSecureDetails(section: SecureSection) {

    const alert = await this.alertController.create({

      header: 'Enter Password',

      message:
        'Please enter your login password to view these details.',

      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: 'Enter your password'
        }
      ],

      buttons: [

        {
          text: 'Cancel',
          role: 'cancel'
        },

        {
          text: 'Verify',

          handler: (data) => {

            const password = data.password;

            if (!password || !password.trim()) {

              this.showMessage(
                'Password Required',
                'Please enter your password.'
              );

              return false;
            }

            this.verifyLoginPassword(
              password,
              section
            );

            return true;
          }
        }

      ]

    });

    await alert.present();
  }

  // ==========================================
  // VERIFY PASSWORD USING LOGIN API
  // ==========================================

  async verifyLoginPassword(
    password: string,
    section: SecureSection
  ) {

    const username =
      this.employee.LoginUsername ||
      this.employee.OfficialEmail;

    if (!username) {

      await this.showMessage(
        'Verification Failed',
        'Login username not found. Please log out and log in again.'
      );

      return;
    }

    const loading = await this.loadingController.create({

      message: 'Verifying password...',

      spinner: 'crescent',

      backdropDismiss: false

    });

    await loading.present();

    try {

      const loginData = {
        Username: username,
        Password: password
      };

      const response = await firstValueFrom(
        this.http.post<any>(
          this.apiUrl,
          loginData
        )
      );

      console.log(
        'Password Verification Response:',
        response
      );

      await loading.dismiss();

      if (response?.result === 'Success') {

        this.ngZone.run(() => {

          // Start timer only after successful verification
          this.startSecureTimer(section);

          this.cdr.detectChanges();

        });

      } else {

        await this.showMessage(
          'Incorrect Password',
          'The password you entered is incorrect.'
        );
      }

    } catch (error) {

      console.error(
        'Password Verification Error:',
        error
      );

      await loading.dismiss();

      await this.showMessage(
        'Verification Error',
        'Unable to verify your password. Please try again.'
      );
    }
  }

  // ==========================================
  // START ONE-MINUTE COUNTDOWN
  // ==========================================

  startSecureTimer(section: SecureSection) {

    // Clear any previous timer for this card
    this.clearSecureTimer(section);

    // Set visibility and initial countdown
    switch (section) {

      case 'bank':

        this.bankDetailsVisible = true;
        this.bankTimer = 60;

        break;

      case 'id':

        this.idProofVisible = true;
        this.idTimer = 60;

        break;

      case 'contact':

        this.contactVisible = true;
        this.contactTimer = 60;

        break;
    }

    // Run countdown every second
    this.secureTimers[section] = setInterval(() => {

      this.ngZone.run(() => {

        switch (section) {

          case 'bank':

            this.bankTimer--;

            if (this.bankTimer <= 0) {

              this.hideSecureDetails('bank');

              return;
            }

            break;

          case 'id':

            this.idTimer--;

            if (this.idTimer <= 0) {

              this.hideSecureDetails('id');

              return;
            }

            break;

          case 'contact':

            this.contactTimer--;

            if (this.contactTimer <= 0) {

              this.hideSecureDetails('contact');

              return;
            }

            break;
        }

        // Update countdown immediately
        this.cdr.detectChanges();

      });

    }, 1000);

    this.cdr.detectChanges();
  }

  // ==========================================
  // STOP INDIVIDUAL TIMER
  // ==========================================

  clearSecureTimer(section: SecureSection) {

    const timer = this.secureTimers[section];

    if (timer) {

      clearInterval(timer);

      delete this.secureTimers[section];
    }
  }

  // ==========================================
  // HIDE DETAILS MANUALLY OR AUTOMATICALLY
  // ==========================================

  hideSecureDetails(section: SecureSection) {

    // Stop selected card timer
    this.clearSecureTimer(section);

    // Mask selected card
    switch (section) {

      case 'bank':

        this.bankDetailsVisible = false;
        this.bankTimer = 0;

        break;

      case 'id':

        this.idProofVisible = false;
        this.idTimer = 0;

        break;

      case 'contact':

        this.contactVisible = false;
        this.contactTimer = 0;

        break;
    }

    this.cdr.detectChanges();
  }

  // ==========================================
  // FORMAT COUNTDOWN AS MM:SS
  // ==========================================

  formatTimer(seconds: number): string {

    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${
      remainingSeconds.toString().padStart(2, '0')
    }`;
  }

  // ==========================================
  // COMMON ALERT
  // ==========================================

  async showMessage(
    header: string,
    message: string
  ) {

    const alert = await this.alertController.create({

      header,

      message,

      buttons: ['OK']

    });

    await alert.present();
  }

  // ==========================================
  // RESET WHEN LEAVING PROFILE PAGE
  // ==========================================

  ionViewWillLeave() {

    this.clearSecureTimer('bank');
    this.clearSecureTimer('id');
    this.clearSecureTimer('contact');

    this.bankDetailsVisible = false;
    this.idProofVisible = false;
    this.contactVisible = false;

    this.bankTimer = 0;
    this.idTimer = 0;
    this.contactTimer = 0;

    this.cdr.detectChanges();
  }

  // ==========================================
  // COMPONENT DESTROY
  // ==========================================

  ngOnDestroy() {

    this.clearSecureTimer('bank');
    this.clearSecureTimer('id');
    this.clearSecureTimer('contact');
  }

}
