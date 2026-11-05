import { Component, OnInit, inject } from '@angular/core';
import { CitySelectorComponent } from './features/city-selector/city-selector.component';
import { LanguageService } from './core/services/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  imports: [CitySelectorComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private languageService = inject(LanguageService);
  private translateService = inject(TranslateService);

  ngOnInit() {
    // Initialize translations and wait for it to complete, then load saved language preference
    this.languageService.initialize(this.translateService).then(() => {
      return this.languageService.loadSavedLanguage();
    }).catch((err) => {
      console.error('Failed to initialize language:', err);
    });
  }
}
