import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';

  // For development: use CORS proxy (REMOVE IN PRODUCTION!)
  private readonly USE_CORS_PROXY = true;
  private readonly CORS_PROXY = 'https://corsproxy.io/?';

  // PUT YOUR OPENAI API KEY HERE
  private readonly API_KEY = '//';

  constructor(private http: HttpClient) {}

  /**
   * Send a message to OpenAI with optional image attachment
   * @param userMessage The text message from the user
   * @param imageFile Optional image file to analyze
   * @returns Observable with the AI response text
   */
  sendMessage(userMessage: string, imageFile?: File): Observable<string> {
    if (!this.API_KEY || !this.API_KEY.startsWith('sk-')) {
      return throwError(() => new Error('OpenAI API key not configured. Please add your API key in openai.service.ts'));
    }

    // If there's an image, convert it first, then make the request
    if (imageFile) {
      return new Observable(observer => {
        this.convertImageToBase64(imageFile).then(base64Image => {
          this.makeApiRequest(userMessage, base64Image).subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
        }).catch(error => {
          observer.error(new Error('Failed to process image: ' + error.message));
        });
      });
    } else {
      return this.makeApiRequest(userMessage);
    }
  }

  /**
   * Make the actual API request to OpenAI
   */
  private makeApiRequest(userMessage: string, imageBase64?: string): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`
    });

    // Build the message content array with language detection
    const contentArray: MessageContent[] = [
      {
        type: 'text',
        text: `You are a helpful AI assistant for Fixit/Maharah platform - a trusted marketplace connecting clients with verified craftsmen and service providers in Egypt.

YOUR ROLE:
- You represent the Fixit platform
- Your goal is to help clients find the RIGHT service on our platform
- NEVER tell them to find an expert elsewhere - WE have the experts!
- Always promote our platform's verified and trusted craftsmen

IMPORTANT INSTRUCTIONS:
- Detect the user's language from their message
- If they write in Arabic, respond ONLY in Arabic
- If they write in English, respond ONLY in English
- Match their language naturally and consistently

GREETINGS:
- If user greets you (hi, hello, مرحبا, أهلا, السلام عليكم, how are you, كيف حالك, etc.)
- Respond warmly and introduce yourself as Fixit AI Assistant (مساعد Fixit الذكي in Arabic)
- Mention that we connect them with verified craftsmen

SERVICE REQUESTS:
When a user requests a service, respond with:

1. **Service Type/Category** (نوع الخدمة)
   - Identify the exact service they need

2. **Estimated Price Range in EGP** (السعر التقديري بالجنيه المصري)
   - Give realistic price range for Egyptian market
   - Be specific (e.g., 200-500 EGP not just "depends")

3. **What We Offer** (ما نقدمه)
   - Emphasize: "We have verified and trusted craftsmen" (عندنا حرفيين معتمدين وموثوقين)
   - Mention: "With years of experience" (معاهم سنين خبرة)
   - Add: "Quality guaranteed" (جودة مضمونة)

4. **Call to Action**
   - Arabic: "اختار خدمة [اسم الخدمة] من المنصة وهنوصلك بأفضل الحرفيين"
   - English: "Select [Service Name] service from our platform and we'll connect you with the best craftsmen"

TONE:
- Professional, friendly, and encouraging
- Confident about our platform's quality
- Promote trust in our verified craftsmen
- Keep responses concise (2-4 sentences)

Now respond to the user's message:`
      },
      {
        type: 'text',
        text: userMessage
      }
    ];

    // Add image if provided
    if (imageBase64) {
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: imageBase64
        }
      });
    }

    const payload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: contentArray
        }
      ],
      max_tokens: 500
    };

    // Use CORS proxy in development to avoid CORS issues
    const apiUrl = this.USE_CORS_PROXY
      ? `${this.CORS_PROXY}${encodeURIComponent(this.API_URL)}`
      : this.API_URL;

    return this.http.post<OpenAIResponse>(apiUrl, payload, { headers }).pipe(
      map(response => {
        if (response.choices && response.choices.length > 0) {
          return response.choices[0].message.content;
        }
        throw new Error('No response from OpenAI');
      }),
      catchError(error => {
        console.error('OpenAI API Error:', error);
        let errorMessage = 'Failed to get AI response. ';

        if (error.status === 401) {
          errorMessage += 'Invalid API key.';
        } else if (error.status === 429) {
          errorMessage += 'Rate limit exceeded.';
        } else if (error.status === 500) {
          errorMessage += 'OpenAI server error.';
        } else if (error.error?.error?.message) {
          errorMessage += error.error.error.message;
        } else {
          errorMessage += 'Please try again.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Convert image file to base64 data URL
   */
  private convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        reject(new Error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.'));
        return;
      }

      // Validate file size (max 20MB for OpenAI)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        reject(new Error('Image too large. Maximum size is 20MB.'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading image file'));
      };

      reader.readAsDataURL(file);
    });
  }
}
