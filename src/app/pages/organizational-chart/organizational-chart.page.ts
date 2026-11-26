
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
export class OrganizationalChartPage  {

  searchText = '';

  managingDirector: Employee = {
    name: 'Ajith Kumar',
    designation: 'Managing Director',
    employeeId: 'EMP001',
    initials: 'AK',
    color: '#344F8A'
  };

  generalManager: Employee = {
    name: 'Ravi Shankar',
    designation: 'General Manager',
    employeeId: 'EMP002',
    initials: 'RS',
    color: '#4779B8'
  };

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

  get filteredDepartments(): Department[] {
    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.departments;
    }

    return this.departments
      .map(department => ({
        ...department,
        members: department.members.filter(employee =>
          employee.name.toLowerCase().includes(search) ||
          employee.designation.toLowerCase().includes(search) ||
          employee.employeeId.toLowerCase().includes(search)
        )
      }))
      .filter(department =>
        department.name.toLowerCase().includes(search) ||
        department.manager.name.toLowerCase().includes(search) ||
        department.manager.designation.toLowerCase().includes(search) ||
        department.manager.employeeId.toLowerCase().includes(search) ||
        department.members.length > 0
      );
  }

  toggleDepartment(department: Department): void {
    department.expanded = !department.expanded;
  }

  get totalEmployees(): number {
    return 2 + this.departments.reduce(
      (total, department) => total + 1 + department.members.length,
      0
    );
  }

  get totalDepartments(): number {
    return this.departments.length;
  }

  get totalTeamMembers(): number {
    return this.departments.reduce(
      (total, department) => total + department.members.length,
      0
    );
  }

}
