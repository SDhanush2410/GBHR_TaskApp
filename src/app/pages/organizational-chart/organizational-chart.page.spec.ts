import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationalChartPage } from './organizational-chart.page';

describe('OrganizationalChartPage', () => {
  let component: OrganizationalChartPage;
  let fixture: ComponentFixture<OrganizationalChartPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationalChartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
