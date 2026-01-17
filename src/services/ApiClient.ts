import { appCheckService } from './firebase/AppCheckService';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await appCheckService.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['X-Firebase-AppCheck'] = token;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[ApiClient] Error fetching ${url}:`, error);
      throw error;
    }
  }

  // Add post, put, delete methods if needed
}

export const apiClient = new ApiClient('https://vt.isapp.dev/');
