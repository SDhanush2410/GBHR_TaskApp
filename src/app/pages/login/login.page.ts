
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {

  email: string = '';
  password: string = '';

  showPassword: boolean = false;
  isLoading: boolean = false;

  private apiUrl =
    'https://gbhermes.in/EdgeHRMSmobileApp/api/Values/Login';

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {

    if (!this.email.trim() || !this.password.trim()) {
      await this.showAlert(
        'Validation',
        'Please enter your email and password.'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Logging in...',
      spinner: 'crescent',
      backdropDismiss: false
    });

    await loading.present();

    this.isLoading = true;

   const loginData = {
  Username: this.email.trim(),
  Password: this.password
};
console.log('Login Request:', loginData);
    this.http.post<any>(this.apiUrl, loginData).subscribe({

      next: async (response) => {

        await loading.dismiss();
        this.isLoading = false;

        if (response.result === 'Success') {

          // Store employee information
          const employeeData = { ...response.data };

          // Do not retain the password returned by the API
          delete employeeData.Password;

          localStorage.setItem(
            'userDetails',
            JSON.stringify(employeeData)
          );

          // Navigate to Home page
          this.router.navigateByUrl('/home', {
            replaceUrl: true
          });

        } else {

          await this.showAlert(
            'Login Failed',
            response.data || 'Invalid email or password.'
          );

        }
      },

      error: async (error) => {

        await loading.dismiss();
        this.isLoading = false;

        console.error('Login API Error:', error);

        await this.showAlert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );

      }

    });
  }

  async showAlert(header: string, message: string) {

    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

}
