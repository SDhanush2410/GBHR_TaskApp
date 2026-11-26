import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportAnalysisPage } from './report-analysis.page';

describe('ReportAnalysisPage', () => {
  let component: ReportAnalysisPage;
  let fixture: ComponentFixture<ReportAnalysisPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportAnalysisPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
