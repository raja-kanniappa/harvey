/**
 * HTTP Client for Galen Usage Tracker API
 */

import { API_CONFIG } from '../config/api.js';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * HTTP Client utility with error handling and request/response interceptors
 */
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use default error message
      }

      throw new ApiClientError(
        response.status,
        errorMessage,
        response.status.toString(),
        errorDetails
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // Check if response is HTML (indicating API endpoint not found or redirect)
    const responseText = await response.text();
    if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html')) {
      throw new ApiClientError(
        404,
        'API endpoint returned HTML instead of JSON - endpoint may not exist',
        'HTML_RESPONSE',
        { responseText: responseText.substring(0, 200) + '...' }
      );
    }

    return responseText as any;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const url = this.buildURL(endpoint, params);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      // Handle network errors
      throw new ApiClientError(
        0,
        error instanceof Error ? error.message : 'Network error occurred',
        'NETWORK_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    try {
      const url = this.buildURL(endpoint, params);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      throw new ApiClientError(
        0,
        error instanceof Error ? error.message : 'Network error occurred',
        'NETWORK_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    try {
      const url = this.buildURL(endpoint, params);
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      throw new ApiClientError(
        0,
        error instanceof Error ? error.message : 'Network error occurred',
        'NETWORK_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const url = this.buildURL(endpoint, params);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      throw new ApiClientError(
        0,
        error instanceof Error ? error.message : 'Network error occurred',
        'NETWORK_ERROR',
        { originalError: error }
      );
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;