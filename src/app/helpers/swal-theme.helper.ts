import Swal, { SweetAlertOptions } from 'sweetalert2';

/**
 * Get theme-aware SweetAlert2 configuration
 * @param isDark Whether the current theme is dark mode
 * @returns SweetAlertOptions with theme-appropriate colors
 */
export function getSwalThemeConfig(isDark: boolean): SweetAlertOptions {
    return {
        background: isDark ? '#2A2A2A' : '#FFFFFF',
        color: isDark ? '#F0F0F0' : '#374151',
        confirmButtonColor: '#FDB813',
        cancelButtonColor: isDark ? '#555555' : '#6B7280',
        denyButtonColor: '#DC2626',
        // Custom CSS class for additional styling
        customClass: {
            popup: isDark ? 'swal-dark-theme' : 'swal-light-theme',
            confirmButton: 'swal-themed-button',
            cancelButton: 'swal-themed-button',
            denyButton: 'swal-themed-button'
        }
    };
}

export const SWAL_THEME_STYLES = `
  .swal-dark-theme {
    border: 1px solid rgba(253, 184, 19, 0.2);
  }
  
  .swal-dark-theme .swal2-html-container {
    color: #F0F0F0;
  }
  
  .swal-dark-theme .swal2-title {
    color: #FFFFFF;
  }
  
  .swal-dark-theme input,
  .swal-dark-theme textarea {
    background-color: #333333;
    border-color: #555555;
    color: #F0F0F0;
  }
  
  .swal-dark-theme input::placeholder,
  .swal-dark-theme textarea::placeholder {
    color: #808080;
  }
  
  .swal-dark-theme input:focus,
  .swal-dark-theme textarea:focus {
    border-color: #FDB813;
    background-color: #3A3A3A;
  }
  
  .swal-light-theme input,
  .swal-light-theme textarea {
    background-color: #FFFFFF;
    border-color: #E5E7EB;
    color: #374151;
  }
  
  .swal-themed-button {
    font-family: 'Cairo', sans-serif;
    font-weight: 600;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    transition: all 0.3s ease;
  }
  
  .swal-themed-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;
