
import { Injectable } from '@angular/core';

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';

import { db } from '../firebase.config';

export interface Employee {

  id: string;

  employeeId: string;

  firstName: string;

  lastName: string;

  email: string;

  companyId: number;

  active: boolean;

}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  constructor() {}

  // Convert a Firestore document into an Employee object.
  private mapEmployee(
    documentId: string,
    data: any
  ): Employee {

    return {

      id: documentId,

      employeeId: data['employeeId'] || '',

      firstName: data['firstName'] || '',

      lastName: data['lastName'] || '',

      email: data['email'] || '',

      companyId: Number(data['companyId'] || 0),

      active: data['active'] === true

    };

  }

  // Get all active employees belonging to company 90.
  async getEmployees(): Promise<Employee[]> {

    try {

      const employeesRef =
        collection(db, 'employees');

      const employeeQuery = query(

        employeesRef,

        where('active', '==', true),

        where('companyId', '==', 90)

      );

      const querySnapshot =
        await getDocs(employeeQuery);

      const employees: Employee[] = [];

      querySnapshot.forEach((document) => {

        const employee = this.mapEmployee(
          document.id,
          document.data()
        );

        employees.push(employee);

      });

      console.log(
        'Employees retrieved:',
        employees
      );

      return employees;

    } catch (error) {

      console.error(
        'Error fetching employees:',
        error
      );

      throw error;

    }

  }

  // Get the currently authenticated Firebase employee.
  async getEmployeeByUid(
    uid: string
  ): Promise<Employee | null> {

    try {

      const employeeRef =
        doc(db, 'employees', uid);

      const employeeSnapshot =
        await getDoc(employeeRef);

      if (!employeeSnapshot.exists()) {

        console.error(
          'Employee document not found for UID:',
          uid
        );

        return null;

      }

      const employee = this.mapEmployee(
        employeeSnapshot.id,
        employeeSnapshot.data()
      );

      console.log(
        'Current Firebase employee:',
        employee
      );

      return employee;

    } catch (error) {

      console.error(
        'Error fetching current employee:',
        error
      );

      throw error;

    }

  }

}
