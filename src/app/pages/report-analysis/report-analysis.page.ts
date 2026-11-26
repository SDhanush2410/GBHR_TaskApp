
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import { Subscription } from 'rxjs';

import {
  Chart,
  registerables
} from 'chart.js';

import {
  DataService,
  IPLPlayer
} from '../../services/data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-report-analysis',
  templateUrl: './report-analysis.page.html',
  styleUrls: ['./report-analysis.page.scss'],
  standalone: false
})
export class ReportAnalysisPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('runsChart')
  runsChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('matchesChart')
  matchesChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('distributionChart')
  distributionChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('rankingChart')
  rankingChart!: ElementRef<HTMLCanvasElement>;

  players: IPLPlayer[] = [];

  totalRuns = 0;
  totalMatches = 0;
  averageRuns = 0;

  highestScorer = '';
  highestRuns = 0;

  private subscription!: Subscription;

  private runsChart?: Chart;
  private matchesChart?: Chart;
  private distributionChart?: Chart;
  private rankingChartInstance?: Chart;

  private viewReady = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {

    this.subscription = this.dataService.players$.subscribe(
      (data: IPLPlayer[]) => {

        this.players = data;

        this.calculateStatistics();

        if (this.viewReady) {
          this.updateCharts();
        }

      }
    );

  }

  ngAfterViewInit(): void {

    this.viewReady = true;

    this.createCharts();

  }

  // SORT PLAYERS BY RUNS

  getTopPlayers(limit: number): IPLPlayer[] {

    return [...this.players]
      .sort((a, b) => b.runs - a.runs)
      .slice(0, limit);

  }

  // CALCULATE STATISTICS

  calculateStatistics(): void {

    this.totalRuns = 0;
    this.totalMatches = 0;

    for (const player of this.players) {

      this.totalRuns += player.runs;
      this.totalMatches += player.matches;

    }

    this.averageRuns = this.players.length > 0
      ? Math.round(this.totalRuns / this.players.length)
      : 0;

    if (this.players.length > 0) {

      const highest = this.getTopPlayers(1)[0];

      this.highestScorer = highest.name;
      this.highestRuns = highest.runs;

    } else {

      this.highestScorer = 'No data';
      this.highestRuns = 0;

    }

  }

  // CREATE ALL FOUR CHARTS

  createCharts(): void {

    const topPlayers = this.getTopPlayers(10);
    const topFive = this.getTopPlayers(5);

    // CHART 1: TOP 10 RUN SCORERS

    this.runsChart = new Chart(
      this.runsChartRef.nativeElement,
      {
        type: 'bar',

        data: {
          labels: topPlayers.map(player => player.name),

          datasets: [{
            label: 'Total Runs',
            data: topPlayers.map(player => player.runs),
            backgroundColor: '#3880ff',
            borderRadius: 6
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            }
          },

          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    );

    // CHART 2: MATCHES PLAYED

    this.matchesChart = new Chart(
      this.matchesChartRef.nativeElement,
      {
        type: 'line',

        data: {
          labels: topPlayers.map(player => player.name),

          datasets: [{
            label: 'Matches Played',
            data: topPlayers.map(player => player.matches),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.15)',
            fill: true,
            tension: 0.4
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      }
    );

    // CHART 3: TOP 5 RUN DISTRIBUTION

    this.distributionChart = new Chart(
      this.distributionChartRef.nativeElement,
      {
        type: 'doughnut',

        data: {
          labels: topPlayers.map(player => player.name),

          datasets: [{
            data: topPlayers.map(player => player.runs),

            backgroundColor: [
              '#ef4444', // 1st player - Red
              '#3880ff', // 2nd player - Blue
              '#f97316', // 3rd player - Orange
              '#facc15', // 4th player - Yellow
              '#8b5cf6'  // 5th player - Purple
            ],
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      }
    );

    // CHART 4: HORIZONTAL PLAYER PERFORMANCE RANKING

    this.rankingChartInstance = new Chart(
      this.rankingChart.nativeElement,
      {
        type: 'bar',

        data: {
          labels: topFive.map(player => player.name),

          datasets: [{
            label: 'Career Runs',

            data: topFive.map(player => player.runs),

            backgroundColor: [
              '#ef4444', // 1st player - Red
              '#3880ff', // 2nd player - Blue
              '#f97316', // 3rd player - Orange
              '#facc15', // 4th player - Yellow
              '#8b5cf6'  // 5th player - Purple
            ],
            borderRadius: 8,
            barThickness: 30
          }]
        },

        options: {
          indexAxis: 'y',

          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              enabled: true,

              callbacks: {
                label: (context) => {
                  return ' Career Runs: ' +
                    Number(context.parsed.x).toLocaleString();
                }
              }
            }
          },

          scales: {

            x: {
              beginAtZero: true,

              title: {
                display: true,
                text: 'Total Career Runs'
              }
            },

            y: {
              title: {
                display: true,
                text: 'Player Name'
              },

              ticks: {
                font: {
                  size: 13,
                  weight: 'bold'
                }
              }
            }

          }
        }
      }
    );

  }

  // UPDATE ALL FOUR CHARTS WHEN PLAYER DATA CHANGES

  updateCharts(): void {

    const topPlayers = this.getTopPlayers(10);
    const topFive = this.getTopPlayers(5);

    // UPDATE RUNS CHART

    if (this.runsChart) {

      this.runsChart.data.labels =
        topPlayers.map(player => player.name);

      this.runsChart.data.datasets[0].data =
        topPlayers.map(player => player.runs);

      this.runsChart.update();

    }

    // UPDATE MATCHES CHART

    if (this.matchesChart) {

      this.matchesChart.data.labels =
        topPlayers.map(player => player.name);

      this.matchesChart.data.datasets[0].data =
        topPlayers.map(player => player.matches);

      this.matchesChart.update();

    }

    // UPDATE DISTRIBUTION CHART

    if (this.distributionChart) {

      this.distributionChart.data.labels =
        topFive.map(player => player.name);

      this.distributionChart.data.datasets[0].data =
        topFive.map(player => player.runs);

      this.distributionChart.update();

    }

    // UPDATE HORIZONTAL RANKING CHART

    if (this.rankingChartInstance) {

      this.rankingChartInstance.data.labels =
        topFive.map(player => player.name);

      this.rankingChartInstance.data.datasets[0].data =
        topFive.map(player => player.runs);

      this.rankingChartInstance.update();

    }

  }

  // CALCULATE AVERAGE RUNS PER MATCH

  getAverageRunsPerMatch(player: IPLPlayer): string {

    if (player.matches === 0) {
      return '0.00';
    }

    return (player.runs / player.matches).toFixed(2);

  }

  // DESTROY CHARTS AND UNSUBSCRIBE

  ngOnDestroy(): void {

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.runsChart?.destroy();
    this.matchesChart?.destroy();
    this.distributionChart?.destroy();
    this.rankingChartInstance?.destroy();

  }

}
