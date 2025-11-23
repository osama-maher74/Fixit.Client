import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenaiService } from '../../services/openai.service';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.css']
})
export class ChatWidgetComponent implements AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  messages: DisplayMessage[] = [];
  userInput = '';
  selectedImage: File | null = null;
  imagePreviewUrl: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  private shouldScrollToBottom = false;

  constructor(private openaiService: OpenaiService) {
    // Add welcome message (bilingual - user can choose their language)
    this.messages.push({
      id: this.generateId(),
      role: 'assistant',
      text: `مرحباً! 👋 Hello!

أنا مساعد Fixit الذكي. تحدث معي بالعربية أو الإنجليزية.
I'm Fixit AI Assistant. Chat with me in Arabic or English.`,
      timestamp: new Date()
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Toggle chat window open/close
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScrollToBottom = true;
    }
  }

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        this.errorMessage = 'Please select a valid image file (JPG, PNG, GIF, or WebP)';
        setTimeout(() => this.errorMessage = null, 3000);
        return;
      }

      // Validate file size (20MB max)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errorMessage = 'Image is too large. Maximum size is 20MB.';
        setTimeout(() => this.errorMessage = null, 3000);
        return;
      }

      this.selectedImage = file;
      this.createImagePreview(file);
      this.errorMessage = null;
    }
  }

  /**
   * Create preview URL for selected image
   */
  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.imagePreviewUrl = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove selected image
   */
  removeImage(): void {
    this.selectedImage = null;
    this.imagePreviewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Send message to AI
   */
  sendMessage(): void {
    const trimmedInput = this.userInput.trim();

    // Validate input
    if (!trimmedInput && !this.selectedImage) {
      this.errorMessage = 'Please enter a message or attach an image';
      setTimeout(() => this.errorMessage = null, 3000);
      return;
    }

    // Create user message
    const userMessage: DisplayMessage = {
      id: this.generateId(),
      role: 'user',
      text: trimmedInput || '(Image only)',
      imageUrl: this.imagePreviewUrl || undefined,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    // Clear input
    const messageText = this.userInput;
    const imageFile = this.selectedImage;
    this.userInput = '';
    this.removeImage();
    this.isLoading = true;
    this.errorMessage = null;

    // Call OpenAI service
    this.openaiService.sendMessage(messageText, imageFile || undefined).subscribe({
      next: (response) => {
        const aiMessage: DisplayMessage = {
          id: this.generateId(),
          role: 'assistant',
          text: response,
          timestamp: new Date()
        };
        this.messages.push(aiMessage);
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error getting AI response:', error);
        this.errorMessage = error.message || 'Failed to get AI response. Please try again.';
        this.isLoading = false;

        // Add error message to chat
        const errorMessage: DisplayMessage = {
          id: this.generateId(),
          role: 'assistant',
          text: `❌ ${this.errorMessage}`,
          timestamp: new Date()
        };
        this.messages.push(errorMessage);
        this.shouldScrollToBottom = true;

        // Clear error after 5 seconds
        setTimeout(() => this.errorMessage = null, 5000);
      }
    });
  }

  /**
   * Handle Enter key press
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Scroll message container to bottom
   */
  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        const container = this.messageContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Generate unique ID for messages
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp for display
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
