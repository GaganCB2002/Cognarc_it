export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cognarc-it-1.onrender.com/api";

interface RefreshTokenResponse {
  token: string;
}

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
    if (typeof window === "undefined") return;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authUser");
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

  private async request<T>(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      // Skip auth for health/diagnostics endpoints
      const isPublicEndpoint = endpoint === '/health' || endpoint.startsWith('/database/') || endpoint.startsWith('/socket/') || endpoint.startsWith('/backend/') || endpoint.startsWith('/tracking/status');
      if (!isPublicEndpoint) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
      }
    }

    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const timeoutMs = options.timeoutMs ?? (endpoint.startsWith("/auth/") ? 15000 : undefined);
    const controller = timeoutMs || options.signal ? new AbortController() : undefined;
    const timeoutId = timeoutMs && controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

    if (options.signal && controller) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener("abort", () => controller.abort(), { once: true });
      }
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
        signal: controller?.signal ?? options.signal,
      });
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw new Error(`Network error: Unable to connect to server. Please check your connection.`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (response.status === 401 && this.refreshToken && !endpoint.includes('/refresh-token')) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json() as RefreshTokenResponse;
          this.accessToken = refreshData.token;
          if (typeof window !== "undefined") localStorage.setItem('accessToken', refreshData.token);
          headers['Authorization'] = `Bearer ${refreshData.token}`;
          const retryResponse = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
            signal: controller?.signal ?? options.signal,
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
      } catch {
        // Refresh failed
      }
      this.setToken(null);
      if (this.onUnauthorized) this.onUnauthorized();
      const errorData = await response.json().catch(() => ({ message: "Authentication required" })) as { message?: string; error?: string };
      throw new Error(errorData.message || errorData.error || "Authentication required");
    }

    if (response.status === 401) {
      this.setToken(null);
      if (this.onUnauthorized) this.onUnauthorized();
      const errorData = await response.json().catch(() => ({ message: "Authentication required" })) as { message?: string; error?: string };
      throw new Error(errorData.message || errorData.error || "Authentication required");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" })) as { message?: string; error?: string };
      const errMsg = error.message || error.error || `HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const json = await response.json();
    if (json && typeof json === "object" && json.success === true && "data" in json) {
      return json.data as T;
    }
    return json as T;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown, extraOptions?: Omit<RequestInit, 'method'>) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...extraOptions,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
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
