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
    // Connect TranslateService to LanguageService so translations can be applied
    this.languageService.initialize(this.translateService).then(() => {
      // Load translations based on saved or system language
      this.languageService.loadSavedLanguage();
    });
  }
}
