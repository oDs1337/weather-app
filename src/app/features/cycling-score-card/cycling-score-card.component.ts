import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CyclingScore } from '../../../core/models/weather.model';

@Component({
  selector: 'app-cycling-score-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cycling-score-card.html',
  styleUrl: './cycling-score-card.component.scss'
})
export class CyclingScoreCardComponent {
  @Input() score!: CyclingScore;
  @Input() city: string = 'Your City';

  private translate = inject(TranslateService);

  getScoreColor(score: number): string {
    if (score >= 80) return '#D7F36A';
    if (score >= 60) return '#B8E054';
    if (score >= 40) return '#E8C45A';
    return '#E8735A';
  }

  getScoreText(score: number): string {
    const key = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'poor';
    return this.translate.instant(`cyclingScore.${key}`);
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  getProgressWidth(score: number): string {
    return `${score}%`;
  }
}
