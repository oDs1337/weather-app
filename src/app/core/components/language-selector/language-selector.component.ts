import { Component, inject, signal } from '@angular/core';
import { LanguageCode, LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class LanguageSelectorComponent {
  protected readonly languageService = inject(LanguageService);
  protected readonly isOpen = signal(false);

  protected toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  protected async selectLanguage(lang: LanguageCode): Promise<void> {
    await this.languageService.setLanguage(lang);
    this.isOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.language-selector')) {
      this.isOpen.set(false);
    }
  }
}
