import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyTrend, MonthlyTrend, YearlyTrend } from '../../models/habit.model';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() data!: WeeklyTrend | MonthlyTrend | YearlyTrend;
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: any;
  private chartInitialized = false;

  ngAfterViewInit(): void {
    this.loadChartLibrary();
  }

  ngOnInit(): void {
    if (this.chartInitialized && this.data) {
      this.updateChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      if (this.chart) {
        // Destroy existing chart to ensure proper reinitialization
        this.chart.destroy();
        this.chart = null;
        this.chartInitialized = false;
      }
      // Initialize new chart with updated data
      this.initializeChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private async loadChartLibrary(): Promise<void> {
    if (typeof window !== 'undefined' && !(window as any).Chart) {
      try {
        // Load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => {
          this.initializeChart();
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load Chart.js:', error);
      }
    } else if (typeof window !== 'undefined') {
      this.initializeChart();
    }
  }

  private initializeChart(): void {
    if (typeof window !== 'undefined' && this.chartCanvas && (window as any).Chart && this.data) {
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new (window as any).Chart(ctx, {
          type: 'bar',
          data: {
            labels: this.data.labels,
            datasets: [{
              label: 'Checks',
              data: this.data.data,
              backgroundColor: 'rgba(77,150,255,0.95)',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
        this.chartInitialized = true;
      }
    }
  }

  private updateChart(): void {
    if (this.chart && this.data) {
      this.chart.data.labels = this.data.labels;
      this.chart.data.datasets[0].data = this.data.data;
      this.chart.update();
    }
  }
}
