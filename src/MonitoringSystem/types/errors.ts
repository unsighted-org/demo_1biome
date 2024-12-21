import { HttpStatus } from "../constants/httpStatus";
import { ErrorType } from "../constants/errors";
import { LogLevel, LogCategory } from "../constants/logging";
import { createLogEntry, LogEntry, SystemContext } from "./logging";
import { isValidErrorType } from "../constants/errors";


export type ErrorCategory = 
  | 'system'    // Infrastructure/Platform
  | 'security'  // A3uth/Access Control
  | 'business'  // Business Logic
  | 'integration'; // External Services


  // 1. Top Level Categories (src/MonitoringSystem/constants/categories.ts)
export enum ErrorCategoryEnum {
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  INTEGRATION = 'integration'
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  statusCode: HttpStatus;
  metadata?: Record<string, unknown>;
  errorReference: string;
  tenantId: string;  // Make tenantId required
  currentTenantId?: string; // Optional for cross-tenant operations
  personalTenantId?: string; // Optional for user-specific errors
}

// src/MonitoringSystem/types/errors.ts
export interface ErrorResponse {
  userMessage: string;
  errorType: ErrorType;
  statusCode: HttpStatus;
  errorReference: string;
  metadata?: Record<string, unknown>;
  tenantId: string;
  currentTenantId?: string;
  personalTenantId?: string;
}

export interface ErrorMessages {
  [key: string]: string;
}

// Your validation function should be:
export const isErrorType = (type: unknown): type is ErrorType => {
  if (typeof type !== 'string') return false;
  
  const [category] = type.split('/');
  return ['system', 'security', 'business', 'integration'].includes(category);
};

export const createErrorLogEntry = (
  baseContext: SystemContext,
  error: Error,
  errorType: ErrorType,
  metadata: Record<string, unknown> = {}
): LogEntry => {
  return createLogEntry(baseContext, {
    level: LogLevel.ERROR,
    category: LogCategory.SYSTEM,
    message: error.message,
    metadata: {
      ...metadata,
      errorType,
      originalError: error
    }
  });
}
