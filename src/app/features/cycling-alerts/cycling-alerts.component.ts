import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CyclingIssue } from '../../../core/models/weather.model';

@Component({
  selector: 'app-cycling-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cycling-alerts.html',
  styles: [`
    .alerts-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;

      .alerts-header {
        padding: 1.25rem 1.5rem;
        background: linear-gradient(135deg, #f56565 0%, #ed8936 100%);
        color: white;

        h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
        }

        p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.875rem;
        }
      }

      .alerts-list {
        padding: 1.25rem 1.5rem;

        .alert-item {
          display: flex;
          gap: 0.875rem;
          padding: 1rem;
          margin-bottom: 0.75rem;
          border-radius: 12px;
          border-left: 4px solid;
          transition: all 0.3s ease;

          &:last-child {
            margin-bottom: 0;
          }

          .alert-icon {
            font-size: 1.75rem;
            flex-shrink: 0;
          }

          .alert-content {
            flex: 1;

            h4 {
              margin: 0 0 0.375rem 0;
              font-size: 1rem;
            }

            p {
              margin: 0;
              line-height: 1.5;
              color: #4a5568;
              font-size: 0.9rem;
            }
          }

          &.alert-danger {
            background: #fed7d7;
            border-color: #e53e3e;

            h4 {
              color: #c53030;
            }
          }

          &.alert-warning {
            background: #fefcbf;
            border-color: #ecc94b;

            h4 {
              color: #975a16;
            }
          }

          &.alert-info {
            background: #bee3f8;
            border-color: #4299e1;

            h4 {
              color: #2b6cb0;
            }
          }
        }
      }
    }

    .no-alerts {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 2rem 1.5rem;
      text-align: center;

      .no-alerts-content {
        .alert-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        h3 {
          margin: 0 0 0.375rem 0;
          color: #2d3748;
          font-size: 1.25rem;
        }

        p {
          margin: 0;
          color: #718096;
          font-size: 0.9375rem;
        }
      }
    }
  `]
})
export class CyclingAlertsComponent {
  @Input() issues: CyclingIssue[] = [];

  getAlertClass(type: string): string {
    switch (type) {
      case 'danger': return 'alert-danger';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'danger': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}
