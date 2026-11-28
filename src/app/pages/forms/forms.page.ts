
import {
  Component,
  OnInit,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { NgForm } from '@angular/forms';

interface Employee {
  firstName: string;
  middleName: string;
  lastName: string;
  employeeCode: string;
  employeeId: string;
  companyId: string;

  currentAddress: string;
  permanentAddress: string;

  officialEmail: string;
  officialMobile: string;
  personalEmail: string;
  personalMobile: string;

  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;

  aadhaarNumber: string;
  panNumber: string;
}

@Component({
  selector: 'app-forms',
  templateUrl: './forms.page.html',
  styleUrls: ['./forms.page.scss'],
  standalone: false
})
export class FormsPage implements OnInit {

  employees: Employee[] = [];
  employee: Employee = this.getEmptyEmployee();

  submitted = false;
  successMessage = '';
  errorMessage = '';

  editingIndex: number | null = null;

  selectedEmployee: Employee | null = null;
  isViewModalOpen = false;

  // Loading spinner properties
  isLoading = false;
  loadingMessage = 'Loading employees...';

  private storageKey = 'taskAppRegisteredEmployees';

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {

    this.isLoading = true;
    this.loadingMessage = 'Loading employees...';

    this.cdr.detectChanges();

    // Short delay so the spinner is visible
    await this.delay(600);

    this.ngZone.run(() => {
      this.loadEmployees();

      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  // Small delay for displaying the spinner
  private delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }

  // Common loading method for Register, Update and Delete
  private async runWithLoading(
    message: string,
    operation: () => void
  ): Promise<void> {

    this.ngZone.run(() => {
      this.isLoading = true;
      this.loadingMessage = message;
      this.cdr.detectChanges();
    });

    // Allow spinner to become visible
    await this.delay(500);

    this.ngZone.run(() => {
      operation();
      this.cdr.detectChanges();
    });

    // Keep spinner visible briefly after the operation
    await this.delay(300);

    this.ngZone.run(() => {
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  // Detect changes while entering form values
  onFieldChange(): void {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  getEmptyEmployee(): Employee {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      employeeCode: '',
      employeeId: '',
      companyId: '',
      currentAddress: '',
      permanentAddress: '',
      officialEmail: '',
      officialMobile: '',
      personalEmail: '',
      personalMobile: '',
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankBranch: '',
      aadhaarNumber: '',
      panNumber: ''
    };
  }

  loadEmployees(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      const parsed = saved ? JSON.parse(saved) : [];

      this.employees = Array.isArray(parsed) ? parsed : [];

    } catch (error) {
      console.error('Error loading employees:', error);
      this.employees = [];
    }
  }

  saveEmployees(): boolean {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.employees)
      );

      return true;

    } catch (error) {
      console.error('Error saving employees:', error);
      return false;
    }
  }

  // Register or Update Employee
  async registerEmployee(form: NgForm): Promise<void> {

    if (this.isLoading) {
      return;
    }

    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    form.control.markAllAsTouched();

    if (form.invalid) {
      this.errorMessage =
        'Please correct all highlighted fields before submitting.';
      return;
    }

    const newEmployee: Employee = {
      ...this.employee,

      firstName: this.employee.firstName.trim(),
      middleName: this.employee.middleName.trim(),
      lastName: this.employee.lastName.trim(),
      employeeCode: this.employee.employeeCode.trim().toUpperCase(),
      employeeId: this.employee.employeeId.trim(),
      companyId: this.employee.companyId.trim(),

      currentAddress: this.employee.currentAddress.trim(),
      permanentAddress: this.employee.permanentAddress.trim(),

      officialEmail: this.employee.officialEmail.trim().toLowerCase(),
      officialMobile: this.employee.officialMobile.trim(),
      personalEmail: this.employee.personalEmail.trim().toLowerCase(),
      personalMobile: this.employee.personalMobile.trim(),

      bankName: this.employee.bankName.trim(),
      accountHolder: this.employee.accountHolder.trim(),
      accountNumber: this.employee.accountNumber.trim(),
      ifscCode: this.employee.ifscCode.trim().toUpperCase(),
      bankBranch: this.employee.bankBranch.trim(),

      aadhaarNumber: this.employee.aadhaarNumber.trim(),
      panNumber: this.employee.panNumber.trim().toUpperCase()
    };

    // Check duplicate Employee ID
    const duplicateEmployeeId = this.employees.some(
      (emp, index) =>
        index !== this.editingIndex &&
        emp.employeeId.toLowerCase() ===
        newEmployee.employeeId.toLowerCase()
    );

    if (duplicateEmployeeId) {
      this.errorMessage = 'Employee ID already exists.';
      return;
    }

    // Check duplicate Employee Code
    const duplicateEmployeeCode = this.employees.some(
      (emp, index) =>
        index !== this.editingIndex &&
        emp.employeeCode.toLowerCase() ===
        newEmployee.employeeCode.toLowerCase()
    );

    if (duplicateEmployeeCode) {
      this.errorMessage = 'Employee Code already exists.';
      return;
    }

    // Check duplicate Official Email
    const duplicateEmail = this.employees.some(
      (emp, index) =>
        index !== this.editingIndex &&
        emp.officialEmail.toLowerCase() ===
        newEmployee.officialEmail.toLowerCase()
    );

    if (duplicateEmail) {
      this.errorMessage = 'Official Email already exists.';
      return;
    }

    const isUpdating = this.editingIndex !== null;

    await this.runWithLoading(
      isUpdating
        ? 'Updating employee...'
        : 'Registering employee...',

      () => {

        const previousEmployees = [...this.employees];

        if (this.editingIndex !== null) {
          this.employees[this.editingIndex] = newEmployee;
        } else {
          this.employees.unshift(newEmployee);
        }

        if (!this.saveEmployees()) {
          this.employees = previousEmployees;

          this.errorMessage =
            'Unable to save employee details. Please try again.';

          return;
        }

        this.successMessage = isUpdating
          ? 'Employee details updated successfully!'
          : 'Employee registered successfully!';

        this.editingIndex = null;
        this.employee = this.getEmptyEmployee();

        form.resetForm(this.employee);
        this.submitted = false;
      }
    );
  }

  // View complete employee details
  viewEmployee(emp: Employee): void {
    this.selectedEmployee = { ...emp };
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedEmployee = null;
  }

  // Edit employee
  editEmployee(index: number): void {

    if (this.isLoading) {
      return;
    }

    this.editingIndex = index;
    this.employee = { ...this.employees[index] };

    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Reset or cancel edit
  resetForm(form: NgForm): void {

    if (this.isLoading) {
      return;
    }

    this.employee = this.getEmptyEmployee();
    this.editingIndex = null;
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';

    form.resetForm(this.employee);
  }

  // Delete employee
  async deleteEmployee(index: number): Promise<void> {

    if (this.isLoading) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this employee?'
    );

    if (!confirmed) {
      return;
    }

    await this.runWithLoading(
      'Deleting employee...',

      () => {

        const previousEmployees = [...this.employees];

        this.employees.splice(index, 1);

        if (!this.saveEmployees()) {
          this.employees = previousEmployees;

          this.errorMessage =
            'Unable to delete employee. Please try again.';

          return;
        }

        if (this.editingIndex === index) {
          this.editingIndex = null;
          this.employee = this.getEmptyEmployee();

        } else if (
          this.editingIndex !== null &&
          this.editingIndex > index
        ) {
          this.editingIndex--;
        }

        this.successMessage = 'Employee deleted successfully!';
        this.errorMessage = '';
      }
    );
  }

  getInitials(emp: Employee): string {
    return (
      (emp.firstName?.charAt(0) || '') +
      (emp.lastName?.charAt(0) || '')
    ).toUpperCase();
  }

  trackByEmployeeId(index: number, emp: Employee): string {
    return emp.employeeId;
  }
}
