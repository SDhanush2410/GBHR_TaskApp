
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {

  employee: any = {};

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadEmployeeDetails();
  }

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
      console.error('Unable to load employee details:', error);

      localStorage.removeItem('userDetails');

      this.router.navigate(['/login'], {
        replaceUrl: true
      });
    }
  }

  get employeeName(): string {
    const firstName = this.employee.FirstName || '';
    const middleName = this.employee.MiddleName || '';
    const lastName = this.employee.LastName || '';

    return `${firstName} ${middleName} ${lastName}`
      .replace(/\s+/g, ' ')
      .trim() || 'Employee';
  }

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
}
