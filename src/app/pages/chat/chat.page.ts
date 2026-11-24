
import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';

import {
  Employee,
  EmployeeService
} from '../../services/employee.service';

import {
  ChatService,
  ChatMessage
} from '../../services/chat.service';

import { auth } from '../../firebase.config';

import {
  onAuthStateChanged,
  Unsubscribe as AuthUnsubscribe
} from 'firebase/auth';

import {
  Unsubscribe as FirestoreUnsubscribe
} from 'firebase/firestore';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false
})
export class ChatPage {

  @ViewChild(IonContent) content!: IonContent;

  // Current Firebase employee
  currentEmployee: Employee | null = null;

  currentFirebaseUid = '';

  // Employee directory
  employees: Employee[] = [];

  filteredEmployeeList: Employee[] = [];

  searchText = '';

  selectedEmployee: Employee | null = null;

  // Chat messages
  messages: ChatMessage[] = [];

  newMessage = '';

  currentChatId = '';

  // Loading states
  isLoading = true;

  isSending = false;

  // Error messages
  errorMessage = '';

  chatError = '';

  // Firebase listeners
  private authSubscription?: AuthUnsubscribe;

  private messageSubscription?: FirestoreUnsubscribe;

  constructor(
    private employeeService: EmployeeService,
    private chatService: ChatService
  ) {}

  // Called whenever the Chat page is opened.
  ionViewWillEnter() {

    this.isLoading = true;

    this.errorMessage = '';

    this.authSubscription = onAuthStateChanged(
      auth,
      async (firebaseUser) => {

        // Firebase user is not logged in.
        if (!firebaseUser) {

          this.currentEmployee = null;

          this.currentFirebaseUid = '';

          this.employees = [];

          this.selectedEmployee = null;

          this.isLoading = false;

          this.errorMessage = '';

          return;
        }

        // Firebase user is logged in.
        this.currentFirebaseUid = firebaseUser.uid;

        console.log(
          'Firebase authenticated:',
          firebaseUser.email,
          firebaseUser.uid
        );

        await this.loadEmployeeDetails(firebaseUser.uid);

      }
    );

  }

  // Load the current employee from Firestore.
  async loadEmployeeDetails(uid: string) {

    this.isLoading = true;

    this.errorMessage = '';

    try {

      const employee =
        await this.employeeService.getEmployeeByUid(uid);

      if (!employee) {

        this.currentEmployee = null;

        this.errorMessage =
          'Your Firebase account is not registered in the employee directory.';

        return;
      }

      if (!employee.active) {

        this.currentEmployee = null;

        this.errorMessage =
          'Your employee account is inactive. Please contact the administrator.';

        return;
      }

      this.currentEmployee = employee;

      console.log(
        'Current Firebase employee:',
        this.currentEmployee
      );

      // Load other employees after current employee is confirmed.
      await this.loadEmployees();

    } catch (error) {

      console.error(
        'Unable to load current employee:',
        error
      );

      this.errorMessage =
        'Unable to load your employee details. Please try again.';

    } finally {

      this.isLoading = false;

    }

  }

  // Load other active employees from Firestore.
  async loadEmployees() {

    try {

      const result =
        await this.employeeService.getEmployees();

      // Exclude the currently logged-in Firebase employee.
      this.employees = result.filter(
        employee =>
          employee.id !== this.currentFirebaseUid
      );

      console.log(
        'Other employees:',
        this.employees
      );

    } catch (error) {

      console.error(
        'Employee loading failed:',
        error
      );

      this.errorMessage =
        'Unable to load employees. Please try again.';

    }

  }

  // Search employees.
  get filteredEmployees(): Employee[] {

    const search =
      this.searchText.toLowerCase().trim();

    return this.employees.filter(employee => {

      const firstName =
        (employee.firstName || '').toLowerCase();

      const lastName =
        (employee.lastName || '').toLowerCase();

      const employeeId =
        (employee.employeeId || '').toLowerCase();

      const email =
        (employee.email || '').toLowerCase();

      return (
        firstName.includes(search) ||
        lastName.includes(search) ||
        employeeId.includes(search) ||
        email.includes(search)
      );

    });

  }

  // Open a one-to-one conversation.
  async openChat(employee: Employee) {

    if (!this.currentFirebaseUid) {

      this.chatError =
        'Please sign in to Firebase first.';

      return;
    }

    this.stopMessageListener();

    this.selectedEmployee = employee;

    this.messages = [];

    this.chatError = '';

    this.currentChatId = '';

    try {

      this.currentChatId =
        await this.chatService.getOrCreateChat(
          this.currentFirebaseUid,
          employee.id
        );

      console.log(
        'Chat opened:',
        this.currentChatId
      );

      this.listenForMessages();

    } catch (error) {

      console.error(
        'Unable to open chat:',
        error
      );

      this.chatError =
        'Unable to open this conversation. Check Firestore permissions.';

    }

  }

  // Listen for incoming and outgoing messages.
  listenForMessages() {

    if (!this.currentChatId) {
      return;
    }

    this.messageSubscription =
      this.chatService.subscribeToMessages(

        this.currentChatId,

        (messages) => {

          this.messages = messages;

          this.scrollToBottom();

        },

        (error) => {

          console.error(
            'Unable to receive messages:',
            error
          );

          this.chatError =
            'Unable to receive messages. Please check your connection.';

        }

      );

  }

  // Send a message.
  async sendMessage() {

    const messageText =
      this.newMessage.trim();

    if (
      !messageText ||
      !this.currentChatId ||
      !this.currentFirebaseUid ||
      this.isSending
    ) {

      return;

    }

    this.isSending = true;

    try {

      await this.chatService.sendMessage(
        this.currentChatId,
        this.currentFirebaseUid,
        messageText
      );

      this.newMessage = '';

    } catch (error) {

      console.error(
        'Message sending failed:',
        error
      );

      this.chatError =
        'Message could not be sent. Please try again.';

    } finally {

      this.isSending = false;

    }

  }

  // Return to employee list.
  backToEmployees() {

    this.stopMessageListener();

    this.selectedEmployee = null;

    this.currentChatId = '';

    this.messages = [];

    this.chatError = '';

  }

  // Stop listening to messages.
  stopMessageListener() {

    if (this.messageSubscription) {

      this.messageSubscription();

      this.messageSubscription = undefined;

    }

  }

  // Stop Firebase listeners when leaving the page.
  ionViewWillLeave() {

    if (this.authSubscription) {

      this.authSubscription();

      this.authSubscription = undefined;

    }

    this.stopMessageListener();

  }

  // Scroll to the newest message.
  scrollToBottom() {

    setTimeout(() => {

      this.content?.scrollToBottom(300);

    }, 100);

  }

  // Check whether a message belongs to the signed-in user.
  isMyMessage(message: ChatMessage): boolean {

    return message.senderId === this.currentFirebaseUid;

  }

}
