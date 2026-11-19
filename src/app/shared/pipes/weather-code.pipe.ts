import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'weatherCode',
})
export class WeatherCodePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(code: number): string {
    return this.translate.instant(`weatherCodes.${code}`) || 'Unknown';
  }
}
