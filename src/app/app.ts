import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingComponent } from './components/loading/loading.component';
import { TranslationService } from './services/translation.service';
// import { NavigationLoadingService } from './services/navigation-loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Fixit.Client');
  private translationService = inject(TranslationService);
  // private navigationLoadingService = inject(NavigationLoadingService);

  ngOnInit(): void {
    // Navigation loading disabled per user request
    // this.navigationLoadingService.initialize();
    // console.log('✅ Navigation loading service initialized');
  }
}
