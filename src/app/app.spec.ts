import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideTranslateService } from '@ngx-translate/core';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideTranslateService({
          lang: 'en',
          fallbackLang: 'en',
        }),
      ],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render city selector when language is ready', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // CitySelectorComponent should be rendered (it's imported in App)
    expect(compiled.querySelector('app-city-selector')).toBeTruthy();
  });
});
