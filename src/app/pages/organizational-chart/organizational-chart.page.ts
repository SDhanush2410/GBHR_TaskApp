
import { Component } from '@angular/core';

interface Employee {
  name: string;
  designation: string;
  employeeId: string;
  initials: string;
  color: string;
}

interface Department {
  name: string;
  manager: Employee;
  members: Employee[];
  expanded: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-organizational-chart',
  templateUrl: './organizational-chart.page.html',
  styleUrls: ['./organizational-chart.page.scss'],
  standalone: false
})
export class OrganizationalChartPage {

  searchText = '';

  // Chart zoom
  zoomLevel = 1;

  private initialPinchDistance = 0;
  private initialPinchZoom = 1;

  // Managing Director
  managingDirector: Employee = {
    name: 'Ajith Kumar',
    designation: 'Managing Director',
    employeeId: 'EMP001',
    initials: 'AK',
    color: '#344F8A'
  };

  // General Manager
  generalManager: Employee = {
    name: 'Ravi Shankar',
    designation: 'General Manager',
    employeeId: 'EMP002',
    initials: 'RS',
    color: '#4779B8'
  };

  // Departments
  departments: Department[] = [

    {
      name: 'Human Resources',
      icon: 'people-outline',
      color: '#8B5CF6',
      expanded: true,

      manager: {
        name: 'Priya Sharma',
        designation: 'HR Manager',
        employeeId: 'EMP003',
        initials: 'PS',
        color: '#8B5CF6'
      },

      members: [
        {
          name: 'Kavitha Devi',
          designation: 'HR Executive',
          employeeId: 'EMP004',
          initials: 'KD',
          color: '#A78BFA'
        },
        {
          name: 'Suresh Babu',
          designation: 'Recruitment Specialist',
          employeeId: 'EMP005',
          initials: 'SB',
          color: '#A78BFA'
        },
        {
          name: 'Meena Raj',
          designation: 'Payroll Executive',
          employeeId: 'EMP006',
          initials: 'MR',
          color: '#A78BFA'
        }
      ]
    },

    {
      name: 'Information Technology',
      icon: 'laptop-outline',
      color: '#2563EB',
      expanded: true,

      manager: {
        name: 'Vikram Raj',
        designation: 'IT Manager',
        employeeId: 'EMP007',
        initials: 'VR',
        color: '#2563EB'
      },

      members: [
        {
          name: 'Dhanush S',
          designation: 'Software Developer',
          employeeId: 'EMP008',
          initials: 'DS',
          color: '#60A5FA'
        },
        {
          name: 'Karthik M',
          designation: 'Frontend Developer',
          employeeId: 'EMP009',
          initials: 'KM',
          color: '#60A5FA'
        },
        {
          name: 'Naveen Kumar',
          designation: 'Backend Developer',
          employeeId: 'EMP010',
          initials: 'NK',
          color: '#60A5FA'
        },
        {
          name: 'Rahul Kumar',
          designation: 'QA Engineer',
          employeeId: 'EMP011',
          initials: 'RK',
          color: '#60A5FA'
        }
      ]
    },

    {
      name: 'Operations',
      icon: 'settings-outline',
      color: '#D97706',
      expanded: true,

      manager: {
        name: 'Vijay Kumar',
        designation: 'Operations Manager',
        employeeId: 'EMP012',
        initials: 'VK',
        color: '#D97706'
      },

      members: [
        {
          name: 'Manoj Kumar',
          designation: 'Team Leader',
          employeeId: 'EMP013',
          initials: 'MK',
          color: '#FBBF24'
        },
        {
          name: 'Deepak Raj',
          designation: 'Operations Executive',
          employeeId: 'EMP014',
          initials: 'DR',
          color: '#FBBF24'
        },
        {
          name: 'Anitha R',
          designation: 'Operations Executive',
          employeeId: 'EMP015',
          initials: 'AR',
          color: '#FBBF24'
        }
      ]
    }

  ];

  // Search input handler
  onSearchInput(event: CustomEvent): void {

    const detail = event.detail as {
      value?: string | null;
    };

    this.searchText = detail.value || '';

  }

  // Employee search matching
  private employeeMatches(
    employee: Employee,
    search: string
  ): boolean {

    return (
      employee.name.toLowerCase().includes(search) ||
      employee.designation.toLowerCase().includes(search) ||
      employee.employeeId.toLowerCase().includes(search) ||
      employee.initials.toLowerCase().includes(search)
    );

  }

  // All employees matching search
  get filteredEmployees(): Employee[] {

    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return [];
    }

    const allEmployees: Employee[] = [
      this.managingDirector,
      this.generalManager
    ];

    this.departments.forEach(department => {

      allEmployees.push(department.manager);

      allEmployees.push(...department.members);

    });

    return allEmployees.filter(employee =>
      this.employeeMatches(employee, search)
    );

  }

  // Filter departments for the normal chart
  get filteredDepartments(): Department[] {

    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.departments;
    }

    return this.departments.filter(department => {

      const departmentMatches =
        department.name.toLowerCase().includes(search);

      const managerMatches =
        this.employeeMatches(department.manager, search);

      const memberMatches =
        department.members.some(employee =>
          this.employeeMatches(employee, search)
        );

      return (
        departmentMatches ||
        managerMatches ||
        memberMatches
      );

    });

  }

  // Search result status
  get hasSearchResults(): boolean {

    return this.filteredEmployees.length > 0;

  }

  // Expand or collapse department
  toggleDepartment(department: Department): void {

    const originalDepartment = this.departments.find(
      item => item.name === department.name
    );

    if (originalDepartment) {

      originalDepartment.expanded =
        !originalDepartment.expanded;

    }

  }

  // Statistics
  get totalEmployees(): number {

    return 2 + this.departments.reduce(
      (total, department) =>
        total + 1 + department.members.length,
      0
    );

  }

  get totalDepartments(): number {

    return this.departments.length;

  }

  get totalTeamMembers(): number {

    return this.departments.reduce(
      (total, department) =>
        total + department.members.length,
      0
    );

  }

  // Set zoom level between 50% and 250%
  private setZoom(value: number): void {

    this.zoomLevel = Math.max(
      0.5,
      Math.min(2.5, Number(value.toFixed(2)))
    );

  }

  // Calculate distance between two fingers
  private getTouchDistance(event: TouchEvent): number {

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];

    const x = touch2.clientX - touch1.clientX;
    const y = touch2.clientY - touch1.clientY;

    return Math.sqrt(x * x + y * y);

  }

  // Start mobile pinch zoom
  onTouchStart(event: TouchEvent): void {

    if (event.touches.length === 2) {

      this.initialPinchDistance =
        this.getTouchDistance(event);

      this.initialPinchZoom = this.zoomLevel;

    }

  }

  // Mobile pinch zoom
  onTouchMove(event: TouchEvent): void {

    if (
      event.touches.length === 2 &&
      this.initialPinchDistance > 0
    ) {

      event.preventDefault();

      const currentDistance =
        this.getTouchDistance(event);

      const scale =
        currentDistance / this.initialPinchDistance;

      this.setZoom(
        this.initialPinchZoom * scale
      );

    }

  }

  // Finish pinch zoom
  onTouchEnd(event: TouchEvent): void {

    if (event.touches.length < 2) {

      this.initialPinchDistance = 0;

    }

  }

  // Desktop Ctrl + mouse wheel zoom
  onChartWheel(event: WheelEvent): void {

    if (event.ctrlKey) {

      event.preventDefault();

      const zoomFactor =
        event.deltaY < 0 ? 1.05 : 0.95;

      this.setZoom(
        this.zoomLevel * zoomFactor
      );

    }

  }

}
