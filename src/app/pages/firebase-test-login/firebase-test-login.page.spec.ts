import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FirebaseTestLoginPage } from './firebase-test-login.page';

describe('FirebaseTestLoginPage', () => {
  let component: FirebaseTestLoginPage;
  let fixture: ComponentFixture<FirebaseTestLoginPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FirebaseTestLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
