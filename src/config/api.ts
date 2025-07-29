/**
 * API Configuration
 * Central configuration for API settings and environment variables
 */

export const API_CONFIG = {
  // Base API URL
  BASE_URL: 'https://galen-usage-tracker.zoomrx.dev/api/',
  
  // Default environment for API calls
  DEFAULT_ENVIRONMENT: 'UAT' as const,
  
  // Default pagination settings
  DEFAULT_LIMIT: 100,
  DEFAULT_OFFSET: 0,
  
  // Default time range settings
  DEFAULT_DAYS: 7,
  
  // Request timeout (in milliseconds)
  REQUEST_TIMEOUT: 30000,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * Environment options available in the API
 */
export const ENVIRONMENT_OPTIONS = [
  'Production',
  'UAT', 
  'Evals',
  'All'
] as const;

export type Environment = typeof ENVIRONMENT_OPTIONS[number];

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(env?: Environment) {
  return {
    environment: env || API_CONFIG.DEFAULT_ENVIRONMENT,
    days: API_CONFIG.DEFAULT_DAYS
  };
}

/**
 * Get pagination configuration
 */
export function getPaginationConfig(limit?: number, offset?: number) {
  return {
    limit: limit || API_CONFIG.DEFAULT_LIMIT,
    offset: offset || API_CONFIG.DEFAULT_OFFSET
  };
}