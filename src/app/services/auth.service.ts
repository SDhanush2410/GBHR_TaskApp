
import { Injectable } from '@angular/core';

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

import { auth } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() {}

  // Login using Firebase Email and Password
  async login(email: string, password: string): Promise<User> {

    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return result.user;
  }

  // Logout from Firebase
  async logout(): Promise<void> {

    await signOut(auth);

  }

  // Get currently logged-in Firebase user
  getCurrentUser(): User | null {

    return auth.currentUser;

  }

  // Listen for login and logout changes
  listenToAuthChanges(callback: (user: User | null) => void) {

    return onAuthStateChanged(auth, callback);

  }

}
