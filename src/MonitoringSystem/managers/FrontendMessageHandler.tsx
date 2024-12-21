// src/MonitoringSystem/managers/FrontendMessageHandler.ts

import { DEFAULT_MESSAGES } from '../constants/messages/defaultMessages';

type MessageSeverity = 'success' | 'error' | 'warning' | 'info';

interface MessageConfig {
  duration?: number;
  position?: 'top' | 'bottom';
  showIcon?: boolean;
}

interface ApiError {
  message: string;
  type: string;
  reference?: string;
  statusCode: number;
}

interface ErrorOptions {
  type?: string;
  details?: any;
  reference?: string;
}

interface ValidationDetails {
  field: string;
  requirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
  message?: string;
}

interface ErrorMetadata {
  field?: string;
  code?: string;
  details?: ValidationDetails;
}

class FrontendMessageHandler {
  private static instance: FrontendMessageHandler;
  private showMessage?: (message: string, severity: MessageSeverity) => void;

  private constructor() {}

  public static getInstance(): FrontendMessageHandler {
    if (!FrontendMessageHandler.instance) {
      FrontendMessageHandler.instance = new FrontendMessageHandler();
    }
    return FrontendMessageHandler.instance;
  }

  public init(
    messageHandler: (message: string, severity: MessageSeverity) => void
  ): void {
    this.showMessage = messageHandler;
  }

  public handleApiError(error: ApiError, config?: MessageConfig): void {
    if (error.statusCode === 400 && error.type === 'VALIDATION_ERROR') {
      this.error(error.message, {
        type: 'validation',
        details: error.reference ? { field: error.reference } : undefined
      });
      return;
    }

    if (error.statusCode === 422) {
      this.error(error.message, {
        type: 'businessValidation',
        details: { code: error.type }
      });
      return;
    }

    // Default error handling
    this.error(error.message || DEFAULT_MESSAGES.ERROR.GENERIC, {
      type: error.type,
      reference: error.reference
    });
  }

  public success(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.SUCCESS.GENERIC, 'success');
  }

  public error(message: string, options?: ErrorOptions): void {
    const errorType = options?.type || 'unknown';
    let displayMessage = message;
    let severity: MessageSeverity = 'error';

    try {
      if (options?.details) {
        switch (errorType) {
          case 'validation':
            const details = options.details as ValidationDetails;
            displayMessage = this.formatValidationError(message, details);
            severity = 'warning'; // Use warning for validation errors
            break;

          case 'businessValidation':
            displayMessage = this.formatBusinessError(message, options.details);
            severity = 'warning';
            break;

          case 'security':
            displayMessage = `Security Error: ${message}`;
            break;

          default:
            displayMessage = message;
        }
      }

      this.showMessage?.(displayMessage, severity);

      // Enhanced logging in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error Details:', {
          message: displayMessage,
          originalMessage: message,
          type: errorType,
          details: options?.details,
          reference: options?.reference,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      // Fallback if error formatting fails
      this.showMessage?.(message, 'error');
      console.error('Error handling failed:', error);
    }
  }

  private formatValidationError(message: string, details: ValidationDetails): string {
    if (details.field === 'password') {
      return this.formatPasswordError(message, details.requirements);
    }

    if (details.field === 'email') {
      return `Email Error: ${message}`;
    }

    return `Validation Error: ${message}`;
  }

  private formatPasswordError(message: string, requirements?: ValidationDetails['requirements']): string {
    if (!requirements) return message;

    const requirementsList = [
      requirements.minLength && `• Must be at least ${requirements.minLength} characters`,
      requirements.requireUppercase && '• Must include an uppercase letter',
      requirements.requireLowercase && '• Must include a lowercase letter',
      requirements.requireNumbers && '• Must include a number',
      requirements.requireSpecialChars && '• Must include a special character (!@#$%^&*)'
    ].filter(Boolean);

    return `
${message}

Password Requirements:
${requirementsList.join('\n')}
    `.trim();
  }

  private formatBusinessError(message: string, metadata: ErrorMetadata): string {
    if (metadata.code === 'USER_ALREADY_EXISTS') {
      return `An account with this email already exists. Please try logging in or reset your password.`;
    }
    return message;
  }

  public warning(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.ERROR.GENERIC, 'warning');
  }

  public info(message: string, config?: MessageConfig): void {
    this.showMessage?.(message || DEFAULT_MESSAGES.SUCCESS.GENERIC, 'info');
  }
}

export const messageHandler = FrontendMessageHandler.getInstance();