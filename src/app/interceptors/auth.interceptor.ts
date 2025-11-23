import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Skip auth interceptor for OpenAI API calls and CORS proxy
  const isOpenAIRequest = req.url.includes('api.openai.com') || req.url.includes('corsproxy.io');

  if (token && !isOpenAIRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
