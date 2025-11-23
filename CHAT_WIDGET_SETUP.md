# AI Chat Widget - Setup Guide

## 📋 Overview

This is a complete Angular v20 implementation of an AI-powered chat widget that integrates with OpenAI's GPT-4o model. The widget allows users to send text messages and images for analysis.

## 🗂️ Files Created

```
src/app/
├── services/
│   └── openai.service.ts          # OpenAI API integration service
└── components/
    └── chat-widget/
        ├── chat-widget.component.ts    # Component logic
        ├── chat-widget.component.html  # Template
        └── chat-widget.component.css   # Styles
```

## 🔧 Setup Instructions

### Step 1: Add Your OpenAI API Key

**IMPORTANT:** Open the file:
```
src/app/services/openai.service.ts
```

Find line **28** and replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key:

```typescript
// PUT YOUR OPENAI API KEY HERE
private readonly API_KEY = 'sk-proj-xxxxxxxxxxxxxxxxxxxxx';
```

🔑 **Get your API key from:** https://platform.openai.com/api-keys

### Step 2: Ensure HttpClient is Available

The widget uses Angular's `HttpClient` for API calls. Make sure you have it configured in your app.

**For Angular 20 (standalone apps):**

Open your `src/app/app.config.ts` and ensure `provideHttpClient()` is included:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    // ... other providers
  ]
};
```

**If you don't have `app.config.ts`**, add it to your `src/main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
});
```

### Step 3: Add the Widget to Your Application

**Option A: Global Widget (Recommended)**

Add the widget to your main `app.component.ts`:

```typescript
import { Component } from '@angular/core';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ChatWidgetComponent,
    // ... other imports
  ],
  template: `
    <router-outlet></router-outlet>
    <!-- Your existing content -->

    <!-- AI Chat Widget (always visible) -->
    <app-chat-widget></app-chat-widget>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Fixit.Client';
}
```

**Option B: Specific Page Only**

Add to any component where you want the chat widget:

```typescript
import { ChatWidgetComponent } from '../components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChatWidgetComponent],
  template: `
    <div class="dashboard">
      <!-- Your content -->
    </div>
    <app-chat-widget></app-chat-widget>
  `
})
export class DashboardComponent { }
```

## 🎨 Features

✅ **Floating Chat Button** - Bottom-left corner, always accessible
✅ **Smooth Animations** - Slide-in/out transitions
✅ **Message History** - Shows conversation with timestamps
✅ **Image Upload** - Attach JPG, PNG, GIF, or WebP images
✅ **Image Preview** - See attached image before sending
✅ **Loading States** - Typing indicator while AI responds
✅ **Error Handling** - Graceful error messages
✅ **Responsive Design** - Works on mobile and desktop
✅ **Auto-scroll** - Automatically scrolls to latest message
✅ **Keyboard Support** - Press Enter to send

## 🚀 Usage

1. **Click the floating chat button** (bottom-left)
2. **Type a message** describing the service needed
3. **Optionally attach an image** using the image button
4. **Press Enter or click Send**
5. **Wait for AI response** (shows typing indicator)
6. **View the analysis** with service type and pricing

## 🎯 API Request Format

The widget sends requests to OpenAI in this format:

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze this service request. Tell me the service type and an approximate price in Egyptian Pounds."
        },
        {
          "type": "text",
          "text": "User's message here"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,..."
          }
        }
      ]
    }
  ]
}
```

## 🎨 Customization

### Change Position

Edit `chat-widget.component.css`:

```css
/* Change from left to right */
.chat-button {
  right: 20px;  /* instead of left: 20px */
}

.chat-window {
  right: 20px;  /* instead of left: 20px */
}
```

### Change Colors

Edit the gradient colors in `chat-widget.component.css`:

```css
.chat-button {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.chat-header {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Change AI Instructions

Edit the prompt in `openai.service.ts` (line ~71):

```typescript
const contentArray: MessageContent[] = [
  {
    type: 'text',
    text: 'Your custom instructions here'
  },
  // ...
];
```

### Adjust Window Size

Edit `chat-widget.component.css`:

```css
.chat-window {
  width: 400px;    /* default: 380px */
  height: 600px;   /* default: 550px */
}
```

## 🔒 Security Notes

⚠️ **IMPORTANT:** The API key is stored in the client-side code. For production:

1. **Move the API key to environment variables:**
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     openaiApiKey: 'your-key-here'
   };
   ```

2. **Better: Use a backend proxy** to avoid exposing your API key:
   - Create a backend endpoint that calls OpenAI
   - Have the Angular service call your backend instead
   - Keep the API key secure on the server

3. **Add rate limiting** to prevent abuse

4. **Monitor usage** on OpenAI dashboard

## 📱 Browser Compatibility

✅ Chrome, Edge, Safari, Firefox (latest versions)
✅ Mobile browsers (iOS Safari, Chrome Mobile)
⚠️ Requires modern browser with ES6+ support

## 🐛 Troubleshooting

### "Failed to get AI response"
- Check your API key is correct
- Verify you have credits in your OpenAI account
- Check browser console for detailed errors

### "Invalid API key"
- Make sure you replaced `YOUR_OPENAI_API_KEY_HERE` with your actual key
- Verify the key starts with `sk-`

### Image upload not working
- Check file is JPG, PNG, GIF, or WebP
- Ensure file is under 20MB
- Check browser console for errors

### Chat widget not appearing
- Verify `HttpClient` is provided
- Check browser console for import errors
- Ensure component is imported in your template

## 💰 Cost Estimation

GPT-4o pricing (as of 2025):
- **Text-only**: ~$0.005 per request (500 tokens)
- **With image**: ~$0.01-0.02 per request

Monitor usage at: https://platform.openai.com/usage

## 📚 Documentation

- OpenAI API: https://platform.openai.com/docs
- Angular HttpClient: https://angular.dev/guide/http
- GPT-4o Vision: https://platform.openai.com/docs/guides/vision

## 🎉 You're Done!

The chat widget is now ready to use. Click the floating button in the bottom-left corner to start chatting with the AI assistant!
