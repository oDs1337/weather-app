import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CitySelectorComponent } from './features/city-selector/city-selector.component';
import { LanguageService } from './core/services/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  imports: [CitySelectorComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private languageService = inject(LanguageService);
  private translateService = inject(TranslateService);

  // Signal to track if translations are fully loaded
  languageReady = signal(false);

  ngOnInit() {
    this.languageService.initialize(this.translateService).then(() => {
      return this.languageService.loadSavedLanguage();
    }).then(() => {
      // Mark as ready only after BOTH initialization AND saved language loading complete
      this.languageReady.set(true);
    }).catch((err) => {
      console.error('Failed to initialize language:', err);
      // Still mark as ready to prevent infinite loading state
      this.languageReady.set(true);
    });

    // Start listening for language changes from iOS Settings app
    this.languageService.startListeningForNativeChanges().catch(err => {
      console.warn('Failed to start native language listener:', err);
    });
  }

  ngOnDestroy() {
    // Clean up the polling interval
    this.languageService.stopListeningForNativeChanges();
  }
}
