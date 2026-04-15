const DEFAULT_CONFIG = {
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

class HttpRequest {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async request(url, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      params = {},
      timeout = this.config.timeout,
      onProgress,
    } = options;

    const fullURL = this.buildURL(url, params);
    const requestHeaders = { ...this.config.headers, ...headers };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (data) {
        if (data instanceof FormData) {
          delete fetchOptions.headers['Content-Type'];
          fetchOptions.body = data;
        } else {
          fetchOptions.body = JSON.stringify(data);
        }
      }

      console.log(`[HTTP ${method}]`, fullURL);

      const response = await fetch(fullURL, fetchOptions);
      clearTimeout(timeoutId);

      const responseData = await this.parseResponse(response);

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        url: fullURL,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '请求超时',
          message: `请求超时 (${timeout}ms)`,
          url: this.buildURL(url, params),
        };
      }

      console.error('[HTTP Error]', error.message);
      return {
        success: false,
        error: error.message,
        message: `请求失败: ${error.message}`,
        url: this.buildURL(url, params),
      };
    }
  }

  buildURL(url, params) {
    let fullURL = url;
    
    if (!url.startsWith('http') && this.config.baseURL) {
      fullURL = `${this.config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    }

    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString;
    }

    return fullURL;
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return await response.text();
      }
    }
    
    if (contentType.includes('text/')) {
      return await response.text();
    }
    
    return await response.blob();
  }

  get(url, options = {}) {
    return this.request(url, { method: 'GET', ...options });
  }

  post(url, data, options = {}) {
    return this.request(url, { method: 'POST', data, ...options });
  }

  put(url, data, options = {}) {
    return this.request(url, { method: 'PUT', data, ...options });
  }

  delete(url, options = {}) {
    return this.request(url, { method: 'DELETE', ...options });
  }
}

const http = new HttpRequest();

export const createHTTPClient = (config) => new HttpRequest(config);

export default http;