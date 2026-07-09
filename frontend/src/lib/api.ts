export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
    }
  }

  setToken(accessToken: string | null, refreshToken?: string | null) {
    this.accessToken = accessToken;
    if (refreshToken !== undefined) {
      this.refreshToken = refreshToken;
    }
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else if (accessToken === null) {
      localStorage.removeItem("refreshToken");
    }
  }

  setOnUnauthorized(handler: () => void) {
    this.onUnauthorized = handler;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401 && this.refreshToken && !endpoint.includes('/refresh-token')) {
      // Attempt token refresh
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          this.accessToken = refreshData.token;
          localStorage.setItem('accessToken', refreshData.token);
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          // Retry original request with new token
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch {
        // Refresh failed, proceed with normal 401 handling
      }
      this.setToken(null);
      if (this.onUnauthorized) {
        this.onUnauthorized();
      }
      const errorData = await response.json().catch(() => ({ message: "Authentication required" }));
      throw new Error(errorData.message || errorData.error || "Authentication required");
    }

    if (response.status === 401) {
      this.setToken(null);
      if (this.onUnauthorized) {
        this.onUnauthorized();
      }
      const errorData = await response.json().catch(() => ({ message: "Authentication required" }));
      throw new Error(errorData.message || errorData.error || "Authentication required");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  uploadFile<T>(endpoint: string, file: File, additionalFields?: Record<string, string>) {
    const formData = new FormData();
    formData.append("file", file);
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => formData.append(key, value));
    }
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }
}

export const api = new ApiClient();
export default api;
