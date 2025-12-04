$cssContent = @"

/* =========================================
   Contact Us Section - Premium Styling
   ========================================= */
.contact-us-section {
  padding: 100px 0;
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
  position: relative;
  overflow: hidden;
}

/* Decorative background element */
.contact-us-section::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(253, 184, 19, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
}

.contact-us-section .section-header {
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
}

.contact-us-section .section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--text-dark) 0%, #4a4a4a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.contact-us-section .section-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.contact-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 60px;
  position: relative;
  z-index: 1;
  align-items: start;
}

/* Form Card Styling */
.form-card {
  background: #ffffff;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.form-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.08);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-dark);
  margin-left: 4px;
}

.form-control {
  padding: 14px 20px;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  font-size: 1rem;
  background-color: #f8fafc;
  transition: all 0.2s ease;
  font-family: inherit;
  color: var(--text-dark);
}

.form-control::placeholder {
  color: #a0aec0;
}

.form-control:focus {
  outline: none;
  background-color: #ffffff;
  border-color: var(--primary-gold);
  box-shadow: 0 0 0 4px rgba(253, 184, 19, 0.1);
}

.form-control.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  margin-left: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

textarea.form-control {
  resize: vertical;
  min-height: 140px;
}

/* Button Styling */
.btn-submit {
  margin-top: 12px;
  padding: 16px 32px;
  background: linear-gradient(135deg, var(--primary-gold) 0%, #e5a50a 100%);
  color: #ffffff;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
  box-shadow: 0 10px 20px rgba(253, 184, 19, 0.2);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(253, 184, 19, 0.3);
  filter: brightness(1.05);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Contact Info Cards */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: #ffffff;
  padding: 30px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateX(5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06);
  border-color: rgba(253, 184, 19, 0.2);
}

.info-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(253, 184, 19, 0.1) 0%, rgba(253, 184, 19, 0.2) 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-gold);
  flex-shrink: 0;
}

.info-icon svg {
  width: 28px;
  height: 28px;
}

.info-card div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.info-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.info-card a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.info-card a:hover {
  color: var(--primary-gold);
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 992px) {
  .contact-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .contact-info {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .info-card {
    flex: 1;
    min-width: 280px;
    flex-direction: column;
    text-align: center;
    padding: 25px;
  }

  .info-card:hover {
    transform: translateY(-5px);
  }
}

@media (max-width: 768px) {
  .contact-us-section {
    padding: 60px 0;
  }

  .section-title {
    font-size: 2rem;
  }

  .form-card {
    padding: 25px;
    border-radius: 20px;
  }

  .contact-info {
    flex-direction: column;
  }

  .info-card {
    width: 100%;
    flex-direction: row;
    text-align: left;
  }
}
"@

Add-Content -Path "src\app\pages\home\home.component.css" -Value $cssContent
