import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'translateServiceName',
    standalone: true,
    pure: false // Make it impure to react to language changes
})
export class TranslateServiceNamePipe implements PipeTransform {
    constructor(private translate: TranslateService) { }

    transform(serviceName: string | null | undefined): string {
        if (!serviceName) {
            return '';
        }

        // Try to get translation from SERVICES.SERVICE_NAMES
        const translationKey = `SERVICES.SERVICE_NAMES.${serviceName}`;
        const translated = this.translate.instant(translationKey);

        // If translation exists and is different from the key, return it
        // Otherwise return the original service name
        return translated !== translationKey ? translated : serviceName;
    }
}
