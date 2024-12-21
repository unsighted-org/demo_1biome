// src/MonitoringSystem/constants/messages/securityMessages.ts
import { SecurityError } from "../errors/securityErrors";

export const SecurityMessages = {
  // Password Messages
  [SecurityError.AUTH_PASSWORD_HASH_FAILED]: {
    error: 'Failed to hash password',
    warn: 'Password hashing encountered issues',
    info: 'Password hashing attempted'
  },
  [SecurityError.AUTH_PASSWORD_VERIFY_FAILED]: {
    error: 'Failed to verify password',
    warn: 'Password verification encountered issues',
    info: 'Password verification attempted'
  },
  // Authentication Messages
  [SecurityError.AUTH_TOKEN_INVALID]: {
    error: 'Invalid authentication token',
    warn: 'Authentication token validation failed',
    info: 'Token validation check performed'
  },
  [SecurityError.AUTH_TOKEN_EXPIRED]: {
    error: 'Authentication token has expired',
    warn: 'Authentication token nearing expiration',
    info: 'Token expiration checked'
  },
  [SecurityError.AUTH_INVALID_CREDENTIALS]: {
    error: 'Invalid login credentials',
    warn: 'Multiple failed login attempts detected',
    info: 'Credential validation performed'
  },
  [SecurityError.AUTH_UNAUTHORIZED]: {
    error: 'Unauthorized access attempt',
    warn: 'Access denied due to missing authentication',
    info: 'Authorization check performed'
  },
  [SecurityError.AUTH_FORBIDDEN]: {
    error: 'Access forbidden',
    warn: 'Attempted access to restricted resource',
    info: 'Permission check performed'
  },

  [SecurityError.AUTH_TOKEN_FAILED]: {
    error: 'Token refresh failed',
    warn: 'Token refresh encountered issues',
    info: 'Token refresh attempted'
  },

  [SecurityError.AUTH_LOGOUT_FAILED]: {
    error: 'Logout failed',
    warn: 'Logout encountered issues',
    info: 'Logout attempted'
  },

  [SecurityError.AUTH_FAILED]: {
    error: 'Authentication failed',
    warn: 'Authentication encountered issues',
    info: 'Authentication attempted'
  },
  [SecurityError.AUTH_ACCESS_DENIED]: {
    error: 'Access denied',
    warn: 'Access denied',
    info: 'Access denied'
  },

  [SecurityError.AUTH_CONSENT_FAILED]: {
    error: 'Consent failed',
    warn: 'Consent encountered issues',
    info: 'Consent attempted'
  },

  [SecurityError.AUTH_INSUFFICIENT_PERMISSIONS]: {
    error: 'Insufficient permissions',
    warn: 'Access denied due to insufficient permissions',
    info: 'Permission check performed'
  },
  [SecurityError.AUTH_HEADER_MISSING]: {
    error: 'Missing authorization header',
    warn: 'Authorization header missing from request',
    info: 'Authorization header check performed'
  },
  [SecurityError.AUTH_PROVIDER_INVALID]: {
    error: 'Invalid provider',
    warn: 'Provider validation failed',
    info: 'Provider lookup performed'
  },

  // Session Messages
  [SecurityError.SESSION_INVALID]: {
    error: 'Invalid session',
    warn: 'Session validation failed',
    info: 'Session check performed'
  },
  [SecurityError.SESSION_EXPIRED]: {
    error: 'Session has expired',
    warn: 'Session nearing expiration',
    info: 'Session expiration checked'
  },
  [SecurityError.SESSION_CREATE_FAILED]: {
    error: 'Failed to create session',
    warn: 'Session creation encountered issues',
    info: 'Session creation attempted'
  },

  // Tenant Messages
  [SecurityError.TENANT_NOT_FOUND]: {
    error: 'Tenant not found',
    warn: 'Attempted access to non-existent tenant',
    info: 'Tenant lookup performed'
  },
  [SecurityError.TENANT_CREATE_FAILED]: {
    error: 'Failed to create tenant',
    warn: 'Tenant creation encountered issues',
    info: 'Tenant creation attempted'
  },
  [SecurityError.TENANT_UPDATE_FAILED]: {
    error: 'Failed to update tenant',
    warn: 'Tenant update encountered issues',
    info: 'Tenant update attempted'
  },

  // Validation Messages
  [SecurityError.VALIDATION_INVALID_INPUT]: {
    error: 'Invalid input provided',
    warn: 'Input validation failed',
    info: 'Input validation performed'
  },
  [SecurityError.VALIDATION_MISSING_FIELD]: {
    error: 'Required field missing',
    warn: 'Missing required field in request',
    info: 'Field presence validation performed'
  },
  [SecurityError.VALIDATION_INVALID_FORMAT]: {
    error: 'Invalid format',
    warn: 'Format validation failed',
    info: 'Format validation performed'
  },

  [SecurityError.AUTH_REFRESH_FAILED]: {
    error: 'Failed to refresh authentication token',
    warn: 'Token refresh encountered issues',
    info: 'Token refresh attempted'
  },

  [SecurityError.REQUEST_INTERCEPTOR_ERROR]: {
    error: 'Request interceptor error',
    warn: 'Request interceptor encountered issues',
    info: 'Request interceptor attempted'
  },

  // API Messages
  [SecurityError.API_REQUEST_FAILED]: {
    error: 'API request failed',
    warn: 'API request encountered issues',
    info: 'API request attempted'
  },

  [SecurityError.TOKEN_OPERATION_FAILED]: {
    error: 'Token operation failed',
    warn: 'Token operation encountered issues',
    info: 'Token operation attempted'
  },

  [SecurityError.AUTH_TOKEN_MISSING]: {
    error: 'Authentication token missing',
    warn: 'Missing authentication token',
    info: 'Token presence check performed'
  },

  [SecurityError.ABUSE_CHECK_FAILED]: {
    error: 'Abuse check failed',
    warn: 'Abuse check encountered issues',
    info: 'Abuse check attempted'
  },

  [SecurityError.AUTH_SIGNUP_FAILED]: {
    error: 'Failed to create user account',
    warn: 'User account creation encountered issues',
    info: 'User account creation attempted'
  },

  [SecurityError.DEVELOPER_API_ERROR]: {
    error: 'Developer API error',
    warn: 'Developer API encountered issues',
    info: 'Developer API request attempted'
  }


} as const;