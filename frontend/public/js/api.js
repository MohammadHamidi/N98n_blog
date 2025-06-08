// Frontend API Client
class BlogAPI {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : '/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Token management
  setToken(token) {
    localStorage.setItem('blog_token', token);
  }

  getToken() {
    return localStorage.getItem('blog_token');
  }

  removeToken() {
    localStorage.removeItem('blog_token');
  }

  // Generic fetch method with error handling
  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const defaultHeaders = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
      const headers = { ...defaultHeaders, ...options.headers };
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        headers,
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Cache management
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Posts API
  async getPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/posts${queryString ? `?${queryString}` : ''}`;
    const cacheKey = `posts_${queryString}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch(endpoint);
    this.setCache(cacheKey, response);
    return response;
  }

  async getPost(slug) {
    const cacheKey = `post_${slug}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch(`/posts/${slug}`);
    this.setCache(cacheKey, response);
    return response;
  }

  async getFeaturedPosts() {
    const cacheKey = 'featured_posts';
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch('/posts/featured');
    this.setCache(cacheKey, response);
    return response;
  }

  async createPost(formData) {
    return await this.fetch('/posts', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async updatePost(id, formData) {
    return await this.fetch(`/posts/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async deletePost(id) {
    return await this.fetch(`/posts/${id}`, {
      method: 'DELETE'
    });
  }

  async getPostStats() {
    const cacheKey = 'post_stats';
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch('/posts/stats/summary');
    this.setCache(cacheKey, response);
    return response;
  }

  // Categories API
  async getCategories() {
    const cacheKey = 'categories';
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch('/categories');
    this.setCache(cacheKey, response);
    return response;
  }

  async getCategory(slug) {
    const cacheKey = `category_${slug}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch(`/categories/${slug}`);
    this.setCache(cacheKey, response);
    return response;
  }

  async createCategory(data) {
    const response = await this.fetch('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // Clear categories cache
    this.cache.delete('categories');
    return response;
  }

  async updateCategory(id, data) {
    const response = await this.fetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    // Clear categories cache
    this.cache.delete('categories');
    return response;
  }

  async deleteCategory(id) {
    const response = await this.fetch(`/categories/${id}`, {
      method: 'DELETE'
    });
    
    // Clear categories cache
    this.cache.delete('categories');
    return response;
  }

  // Tags API
  async getTags() {
    const cacheKey = 'tags';
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch('/tags');
    this.setCache(cacheKey, response);
    return response;
  }

  async getTag(slug) {
    const cacheKey = `tag_${slug}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const response = await this.fetch(`/tags/${slug}`);
    this.setCache(cacheKey, response);
    return response;
  }

  async createTag(data) {
    const response = await this.fetch('/tags', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    // Clear tags cache
    this.cache.delete('tags');
    return response;
  }

  async updateTag(id, data) {
    const response = await this.fetch(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    // Clear tags cache
    this.cache.delete('tags');
    return response;
  }

  async deleteTag(id) {
    const response = await this.fetch(`/tags/${id}`, {
      method: 'DELETE'
    });

    // Clear tags cache
    this.cache.delete('tags');
    return response;
  }

  // Upload image for content
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return await this.fetch('/uploads', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  }

  // Authentication
  async login(email, password) {
    const res = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async register(name, email, password) {
    const res = await this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  // Utility methods
  clearCache() {
    this.cache.clear();
  }

  // Format date for Persian display
  formatPersianDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  // Get icon for category/tag
  getIcon(iconClass = 'fas fa-folder') {
    return iconClass;
  }

  // Truncate text
  truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Search functionality
  async searchPosts(query, filters = {}) {
    const params = {
      search: query,
      ...filters
    };
    
    return await this.getPosts(params);
  }

  // Debounced search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Create global API instance
window.blogAPI = new BlogAPI();

// Loading states management
class LoadingManager {
  constructor() {
    this.activeLoaders = new Set();
  }

  show(loaderId) {
    this.activeLoaders.add(loaderId);
    this.updateUI();
  }

  hide(loaderId) {
    this.activeLoaders.delete(loaderId);
    this.updateUI();
  }

  updateUI() {
    const isLoading = this.activeLoaders.size > 0;
    
    // Update loading indicators
    document.querySelectorAll('.loading-spinner').forEach(spinner => {
      spinner.style.display = isLoading ? 'block' : 'none';
    });

    // Update loading overlay
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.style.display = isLoading ? 'flex' : 'none';
    }

    // Update cursor
    document.body.style.cursor = isLoading ? 'wait' : 'default';
  }

  async withLoading(loaderId, asyncFunction) {
    try {
      this.show(loaderId);
      return await asyncFunction();
    } finally {
      this.hide(loaderId);
    }
  }
}

// Create global loading manager
window.loadingManager = new LoadingManager();

// Error handling utilities
class ErrorHandler {
  static show(message, type = 'error') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  static success(message) {
    this.show(message, 'success');
  }

  static error(message) {
    this.show(message, 'error');
  }
}

// Make ErrorHandler globally available
window.ErrorHandler = ErrorHandler;

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .notification-close {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    margin-left: auto;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(notificationStyles);

console.log('🚀 Blog API Client initialized successfully!');