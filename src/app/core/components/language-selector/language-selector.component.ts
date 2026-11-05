import { Component, OnInit, inject } from '@angular/core';
import { LanguageService, LanguageCode } from '../../services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [],
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.scss'
})
export class LanguageSelectorComponent implements OnInit {
  isOpen = false;
  languageService = inject(LanguageService);

  ngOnInit() {
    // Close dropdown when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  async selectLanguage(lang: LanguageCode) {
    await this.languageService.setLanguage(lang);
    this.isOpen = false;
  }

  private onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.language-selector')) {
      this.isOpen = false;
    }
  }
}
