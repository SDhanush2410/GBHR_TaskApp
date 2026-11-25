
import {
  Component,
  ViewChild,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

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
    private chatService: ChatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  // Called whenever the Chat page is opened.
  ionViewWillEnter() {

    // Avoid creating duplicate authentication listeners.
    this.authSubscription?.();

    this.stopMessageListener();

    this.isLoading = true;
    this.errorMessage = '';

    this.authSubscription = onAuthStateChanged(
      auth,
      (firebaseUser) => {

        // Run Firebase authentication updates inside Angular.
        this.ngZone.run(() => {

          if (!firebaseUser) {

            this.stopMessageListener();

            this.currentEmployee = null;
            this.currentFirebaseUid = '';

            this.employees = [];
            this.selectedEmployee = null;

            this.messages = [];
            this.currentChatId = '';

            this.isLoading = false;

            this.cdr.detectChanges();

            return;
          }

          this.currentFirebaseUid = firebaseUser.uid;

          console.log(
            'Firebase authenticated:',
            firebaseUser.email,
            firebaseUser.uid
          );

          this.isLoading = true;

          this.cdr.detectChanges();

          void this.loadEmployeeDetails(firebaseUser.uid);

        });

      }
    );

  }

  // Load current employee details from Firestore.
  async loadEmployeeDetails(uid: string) {

    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    });

    try {

      const employee =
        await this.employeeService.getEmployeeByUid(uid);

      this.ngZone.run(() => {

        // Ignore outdated authentication results.
        if (uid !== this.currentFirebaseUid) {
          return;
        }

        if (!employee) {

          this.currentEmployee = null;

          this.errorMessage =
            'Your Firebase account is not registered in the employee directory.';

          this.isLoading = false;

          this.cdr.detectChanges();

          return;
        }

        if (!employee.active) {

          this.currentEmployee = null;

          this.errorMessage =
            'Your employee account is inactive. Please contact the administrator.';

          this.isLoading = false;

          this.cdr.detectChanges();

          return;
        }

        this.currentEmployee = employee;

        console.log(
          'Current Firebase employee:',
          this.currentEmployee
        );

        this.cdr.detectChanges();

      });

      if (employee?.active) {
        await this.loadEmployees();
      }

    } catch (error) {

      console.error(
        'Unable to load current employee:',
        error
      );

      this.ngZone.run(() => {

        this.errorMessage =
          'Unable to load your employee details. Please try again.';

        this.cdr.detectChanges();

      });

    } finally {

      this.ngZone.run(() => {

        if (uid === this.currentFirebaseUid) {
          this.isLoading = false;
        }

        this.cdr.detectChanges();

      });

    }

  }

  // Load other active employees from Firestore.
  async loadEmployees() {

    try {

      const result =
        await this.employeeService.getEmployees();

      this.ngZone.run(() => {

        this.employees = result.filter(
          employee =>
            employee.id !== this.currentFirebaseUid
        );

        console.log(
          'Other employees:',
          this.employees
        );

        this.cdr.detectChanges();

      });

    } catch (error) {

      console.error(
        'Employee loading failed:',
        error
      );

      this.ngZone.run(() => {

        this.errorMessage =
          'Unable to load employees. Please try again.';

        this.cdr.detectChanges();

      });

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

    this.cdr.detectChanges();

    try {

      const chatId =
        await this.chatService.getOrCreateChat(
          this.currentFirebaseUid,
          employee.id
        );

      this.ngZone.run(() => {

        this.currentChatId = chatId;

        console.log(
          'Chat opened:',
          this.currentChatId
        );

        this.cdr.detectChanges();

        this.listenForMessages();

      });

    } catch (error) {

      console.error(
        'Unable to open chat:',
        error
      );

      this.ngZone.run(() => {

        this.chatError =
          'Unable to open this conversation. Check Firestore permissions.';

        this.cdr.detectChanges();

      });

    }

  }

  // Listen for incoming and outgoing messages in real time.
  listenForMessages() {

    if (!this.currentChatId) {
      return;
    }

    this.stopMessageListener();

    this.messageSubscription =
      this.chatService.subscribeToMessages(

        this.currentChatId,

        (messages) => {

          // IMPORTANT:
          // Firebase callback runs inside Angular NgZone.
          this.ngZone.run(() => {

            this.messages = [...messages];

            console.log(
              'Real-time messages received:',
              this.messages
            );

            this.cdr.detectChanges();

            this.scrollToBottom();

          });

        },

        (error) => {

          this.ngZone.run(() => {

            console.error(
              'Unable to receive messages:',
              error
            );

            this.chatError =
              'Unable to receive messages. Please check your connection.';

            this.cdr.detectChanges();

          });

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

    this.chatError = '';

    this.cdr.detectChanges();

    try {

      await this.chatService.sendMessage(
        this.currentChatId,
        this.currentFirebaseUid,
        messageText
      );

      this.ngZone.run(() => {

        this.newMessage = '';

        console.log(
          'Message sent successfully:',
          messageText
        );

        this.cdr.detectChanges();

      });

      // Firestore onSnapshot will update the messages.
      // No manual message insertion is required.

    } catch (error) {

      console.error(
        'Message sending failed:',
        error
      );

      this.ngZone.run(() => {

        this.chatError =
          'Message could not be sent. Please try again.';

        this.cdr.detectChanges();

      });

    } finally {

      this.ngZone.run(() => {

        this.isSending = false;

        this.cdr.detectChanges();

      });

    }

  }

  // Return to employee list.
  backToEmployees() {

    this.stopMessageListener();

    this.selectedEmployee = null;

    this.currentChatId = '';

    this.messages = [];

    this.chatError = '';

    this.cdr.detectChanges();

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

      this.ngZone.run(() => {

        this.content?.scrollToBottom(300);

      });

    }, 100);

  }

  // Check whether a message belongs to the signed-in user.
  isMyMessage(message: ChatMessage): boolean {

    return message.senderId === this.currentFirebaseUid;

  }
  getDateLabel(date: Date | null): string {

  if (!date) return '';

  const messageDate = new Date(date);
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => {

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );

  };

  if (isSameDay(messageDate, today)) {
    return 'Today';
  }

  if (isSameDay(messageDate, yesterday)) {
    return 'Yesterday';
  }

  return messageDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

}


shouldShowDate(index: number): boolean {

  if (index === 0) return true;

  const currentDate = this.messages[index].createdAt;
  const previousDate = this.messages[index - 1].createdAt;

  if (!currentDate || !previousDate) return true;

  return (
    currentDate.getDate() !== previousDate.getDate() ||
    currentDate.getMonth() !== previousDate.getMonth() ||
    currentDate.getFullYear() !== previousDate.getFullYear()
  );

}


formatMessageTime(date: Date | null): string {

  if (!date) return '';

  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

}

}
