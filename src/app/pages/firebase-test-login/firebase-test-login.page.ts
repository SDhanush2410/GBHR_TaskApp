
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import {
  signInWithEmailAndPassword
} from 'firebase/auth';

import { auth } from '../../firebase.config';

@Component({
  selector: 'app-firebase-test-login',
  templateUrl: './firebase-test-login.page.html',
  styleUrls: ['./firebase-test-login.page.scss'],
  standalone: false
})
export class FirebaseTestLoginPage {

  email: string = '';
  password: string = '';

  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router
  ) {}

  async login() {

    this.errorMessage = '';

    const emailValue = this.email.trim();

    if (!emailValue || !this.password) {

      this.errorMessage =
        'Please enter your email and password.';

      return;
    }

    this.isLoading = true;

    try {

      const result = await signInWithEmailAndPassword(
        auth,
        emailValue,
        this.password
      );

      console.log(
        'Firebase login successful:',
        result.user.email,
        result.user.uid
      );

      await this.router.navigateByUrl('/chat', {
        replaceUrl: true
      });

    } catch (error: any) {

      console.error('Firebase login error:', error);

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {

        this.errorMessage = 'Invalid email or password.';

      } else if (error.code === 'auth/too-many-requests') {

        this.errorMessage =
          'Too many login attempts. Please try again later.';

      } else {

        this.errorMessage =
          error.message || 'Firebase login failed.';

      }

    } finally {

      this.isLoading = false;

    }
  }

}
