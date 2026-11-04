import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CyclingScore } from '../../../core/models/weather.model';

@Component({
  selector: 'app-cycling-score-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cycling-score-card.html',
  styles: [`
    .score-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;

      .card-header {
        padding: 1.5rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .city-name {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
        }
      }

      .overall-score {
        padding: 2rem;
        text-align: center;
        color: white;

        .score-circle {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto 1.5rem;

          svg {
            width: 100%;
            height: 100%;
          }

          .score-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;

            .score-value {
              display: block;
              font-size: 2.5rem;
              font-weight: bold;
              line-height: 1;
            }

            .score-label {
              display: block;
              font-size: 0.9rem;
              opacity: 0.9;
            }
          }
        }

        .score-message {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
      }

      .individual-scores {
        padding: 1.5rem 2rem;

        .score-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          margin-bottom: 0.75rem;
          background: #f7fafc;
          border-radius: 12px;
          transition: all 0.3s ease;

          &:last-child {
            margin-bottom: 0;
          }

          &:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .score-icon {
            font-size: 1.5rem;
            width: 40px;
            text-align: center;
          }

          .score-info {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .score-title {
              font-size: 0.9rem;
              color: #718096;
            }

            .score-value {
              font-weight: 700;
              font-size: 1rem;
            }
          }

          .score-status {
            font-size: 0.85rem;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            background: #e2e8f0;
            color: #4a5568;
          }

          &.excellent {
            background: #c6f6d5;
            
            .score-status {
              background: #48bb78;
              color: white;
            }
          }

          &.good {
            background: #fefcbf;
            
            .score-status {
              background: #ecc94b;
              color: white;
            }
          }

          &.fair {
            background: #feebc8;
            
            .score-status {
              background: #ed8936;
              color: white;
            }
          }

          &.poor {
            background: #fed7d7;
            
            .score-status {
              background: #e53e3e;
              color: white;
            }
          }
        }
      }
    }
  `]
})
export class CyclingScoreCardComponent {
  @Input() score!: CyclingScore;
  @Input() city: string = 'Your City';

  getScoreColor(score: number): string {
    if (score >= 80) return '#48bb78'; // Green - Excellent
    if (score >= 60) return '#ecc94b'; // Yellow-Good
    if (score >= 40) return '#ed8936'; // Orange-Fair
    return '#e53e3e'; // Red-Poor
  }

  getScoreText(score: number): string {
    if (score >= 80) return 'Excellent conditions for cycling! 🚴‍♂️';
    if (score >= 60) return 'Good conditions for cycling 👍';
    if (score >= 40) return 'Fair conditions - use caution ⚠️';
    return 'Not recommended for cycling ❌';
  }

  getScoreIcon(score: number): string {
    if (score >= 80) return '🏆';
    if (score >= 60) return '✅';
    if (score >= 40) return '⚡';
    return '🛑';
  }

  getProgressWidth(score: number): string {
    return `${score}%`;
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }
}
