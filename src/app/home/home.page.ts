
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  employeeName: string = 'Employee';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadEmployeeDetails();
  }

  loadEmployeeDetails() {
    const storedData = localStorage.getItem('userDetails');

    if (!storedData) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const employee = JSON.parse(storedData);

      const firstName = employee.FirstName || employee.firstName || '';
      const lastName = employee.LastName || employee.lastName || '';

      const fullName = `${firstName} ${lastName}`.trim();

      this.employeeName = fullName || 'Employee';

    } catch (error) {
      console.error('Unable to read employee details:', error);
      this.employeeName = 'Employee';
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToAttendance() {
    this.router.navigate(['/attendance']);
  }
}
