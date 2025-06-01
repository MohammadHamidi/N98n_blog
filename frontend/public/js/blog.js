// Blog Frontend Main Logic
class BlogFrontend {
  constructor() {
    this.currentPage = 1;
    this.currentFilters = {};
    this.postsPerPage = 6;
    this.searchTimeout = null;
    
    this.init();
  }

  async init() {
    try {
      // Initialize event listeners
      this.setupEventListeners();
      
      // Load initial data
      await Promise.all([
        this.loadPosts(),
        this.loadCategories(),
        this.loadTags(),
        this.loadFeaturedPosts()
      ]);

      // Setup scroll effects
      this.setupScrollEffects();
      
      console.log('✅ Blog frontend initialized successfully!');
      
    } catch (error) {
      console.error('❌ Error initializing blog:', error);
      ErrorHandler.error('خطا در بارگذاری اولیه بلاگ');
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, 500);
      });

      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch(e.target.value);
        }
      });

      searchBtn.addEventListener('click', () => {
        this.handleSearch(searchInput.value);
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // CTA button smooth scroll
    const ctaButton = document.querySelector('.cta-button[href="#posts"]');
    if (ctaButton) {
      ctaButton.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('posts').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    }

    // Mobile menu
    this.setupMobileMenu();
  }

  setupMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileBtn && navMenu) {
      mobileBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !mobileBtn.contains(e.target)) {
          navMenu.classList.remove('active');
        }
      });
    }
  }

  setupScrollEffects() {
    // Header scroll effect
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      if (!header) return;

      if (window.scrollY > 50) {
        header.style.background = 'rgba(44, 44, 84, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
      } else {
        header.style.background = '#2c2c54';
        header.style.backdropFilter = 'none';
      }

      lastScrollY = window.scrollY;
    });

    // Animate posts on scroll
    this.setupScrollAnimation();
  }

  setupScrollAnimation() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all blog cards
    document.querySelectorAll('.blog-card').forEach(card => {
      observer.observe(card);
    });
  }

  async loadPosts(page = 1, filters = {}) {
    try {
      loadingManager.show('posts');
      
      const params = {
        page,
        limit: this.postsPerPage,
        ...filters
      };

      const response = await blogAPI.getPosts(params);
      
      if (response.success) {
        this.renderPosts(response.data.posts);
        this.renderPagination(response.data.pagination);
        this.currentPage = page;
        this.currentFilters = filters;
      } else {
        throw new Error('Failed to load posts');
      }

    } catch (error) {
      console.error('Error loading posts:', error);
      this.showNoPosts();
      ErrorHandler.error('خطا در بارگذاری مقالات');
    } finally {
      loadingManager.hide('posts');
    }
  }

  renderPosts(posts) {
    const container = document.getElementById('posts-container');
    const noPostsDiv = document.getElementById('no-posts');
    
    if (!container) return;

    if (!posts || posts.length === 0) {
      this.showNoPosts();
      return;
    }

    // Hide no posts message and loading
    noPostsDiv.style.display = 'none';
    
    // Generate posts HTML
    container.innerHTML = posts.map(post => this.createPostCard(post)).join('');

    // Setup click handlers for post cards
    container.querySelectorAll('.blog-card').forEach((card, index) => {
      card.addEventListener('click', () => {
        const slug = posts[index].slug;
        window.location.href = `post.html?slug=${slug}`;
      });

      // Add animation delay
      card.style.animationDelay = `${index * 0.1}s`;
    });

    // Re-setup scroll animation for new cards
    setTimeout(() => this.setupScrollAnimation(), 100);
  }

  createPostCard(post) {
    const featuredImage = post.featuredImage?.url 
      ? `<img src="${post.featuredImage.url}" alt="${post.featuredImage.alt || post.title}" style="width: 100%; height: 100%; object-fit: cover;">`
      : `<i class="fas fa-${this.getPostIcon(post.categories)}"></i>`;

    const categories = post.categories?.map(cat => 
      `<span style="color: ${cat.color || '#667eea'}">${cat.name}</span>`
    ).join(', ') || '';

    const tags = post.tags?.slice(0, 2).map(tag => tag.name).join(', ') || '';

    return `
      <article class="blog-card" data-slug="${post.slug}">
        <div class="blog-card-image">
          ${featuredImage}
        </div>
        <div class="blog-card-content">
          <h3>${post.title}</h3>
          <div class="blog-meta">
            <span><i class="fas fa-calendar-alt"></i> ${blogAPI.formatPersianDate(post.publishedAt)}</span>
            <span><i class="fas fa-user"></i> ${post.author.name}</span>
            ${categories ? `<span><i class="fas fa-tag"></i> ${categories}</span>` : ''}
            <span><i class="fas fa-eye"></i> ${post.views || 0} بازدید</span>
            ${post.readingTime ? `<span><i class="fas fa-clock"></i> ${post.readingTime} دقیقه</span>` : ''}
          </div>
          <p class="blog-excerpt">
            ${blogAPI.truncateText(post.excerpt, 150)}
          </p>
          <a href="post.html?slug=${post.slug}" class="read-more" onclick="event.stopPropagation()">
            ادامه مطلب <i class="fas fa-arrow-left"></i>
          </a>
        </div>
      </article>
    `;
  }

  getPostIcon(categories) {
    if (!categories || categories.length === 0) return 'file-alt';
    
    const iconMap = {
      'unity': 'gamepad',
      'mq5': 'chart-line',
      'trading': 'chart-bar',
      'ai': 'brain',
      'performance': 'tachometer-alt',
      'mobile': 'mobile-alt',
      'networking': 'network-wired'
    };

    const category = categories[0];
    const categoryName = category.name?.toLowerCase() || category.toLowerCase();
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryName.includes(key)) {
        return icon;
      }
    }
    
    return 'code';
  }

  showNoPosts() {
    const container = document.getElementById('posts-container');
    const noPostsDiv = document.getElementById('no-posts');
    
    if (container) container.innerHTML = '';
    if (noPostsDiv) noPostsDiv.style.display = 'block';
    
    // Hide pagination
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) paginationContainer.style.display = 'none';
  }

  renderPagination(pagination) {
    const container = document.getElementById('pagination-container');
    if (!container || !pagination) return;

    const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;

    if (totalPages <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';

    let paginationHTML = '';

    // Previous button
    if (hasPrevPage) {
      paginationHTML += `<a href="#" data-page="${currentPage - 1}"><i class="fas fa-chevron-right"></i></a>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<a href="#" data-page="1">1</a>`;
      if (startPage > 2) {
        paginationHTML += `<span>...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        paginationHTML += `<span class="current">${i}</span>`;
      } else {
        paginationHTML += `<a href="#" data-page="${i}">${i}</a>`;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span>...</span>`;
      }
      paginationHTML += `<a href="#" data-page="${totalPages}">${totalPages}</a>`;
    }

    // Next button
    if (hasNextPage) {
      paginationHTML += `<a href="#" data-page="${currentPage + 1}"><i class="fas fa-chevron-left"></i></a>`;
    }

    container.innerHTML = paginationHTML;

    // Add click handlers
    container.querySelectorAll('a[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        this.loadPosts(page, this.currentFilters);
        
        // Scroll to top of posts
        document.getElementById('posts').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });
  }

  async loadCategories() {
    try {
      const response = await blogAPI.getCategories();
      
      if (response.success) {
        this.renderCategories(response.data);
      }

    } catch (error) {
      console.error('Error loading categories:', error);
      document.getElementById('categories-list').innerHTML = '<li>خطا در بارگذاری دسته‌بندی‌ها</li>';
    }
  }

  renderCategories(categories) {
    const container = document.getElementById('categories-list');
    if (!container) return;

    if (!categories || categories.length === 0) {
      container.innerHTML = '<li>دسته‌بندی‌ای یافت نشد</li>';
      return;
    }

    container.innerHTML = categories.map(category => `
      <li>
        <a href="#" data-category-id="${category._id}" style="color: ${category.color || '#495057'}">
          ${category.name}
          <span class="category-count">${category.postCount || 0}</span>
        </a>
      </li>
    `).join('');

    // Add click handlers
    container.querySelectorAll('a[data-category-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.filterByCategory(e.target.dataset.categoryId);
        
        // Update active state
        container.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }

  async loadTags() {
    try {
      const response = await blogAPI.getTags();
      
      if (response.success) {
        this.renderTags(response.data);
      }

    } catch (error) {
      console.error('Error loading tags:', error);
      document.getElementById('tags-cloud').innerHTML = '<span>خطا در بارگذاری برچسب‌ها</span>';
    }
  }

  renderTags(tags) {
    const container = document.getElementById('tags-cloud');
    if (!container) return;

    if (!tags || tags.length === 0) {
      container.innerHTML = '<span>برچسبی یافت نشد</span>';
      return;
    }

    // Sort by popularity and take top 10
    const popularTags = tags
      .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
      .slice(0, 10);

    container.innerHTML = popularTags.map(tag => `
      <a href="#" class="tag" data-tag-id="${tag._id}" style="background-color: ${tag.color || '#f8f9fa'}">
        ${tag.name}
      </a>
    `).join('');

    // Add click handlers
    container.querySelectorAll('a[data-tag-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.filterByTag(e.target.dataset.tagId);
        
        // Update active state
        container.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }

  async loadFeaturedPosts() {
    try {
      const response = await blogAPI.getFeaturedPosts();
      
      if (response.success) {
        this.renderFeaturedPosts(response.data);
      }

    } catch (error) {
      console.error('Error loading featured posts:', error);
      document.getElementById('featured-posts').innerHTML = '<li>خطا در بارگذاری مقالات پربازدید</li>';
    }
  }

  renderFeaturedPosts(posts) {
    const container = document.getElementById('featured-posts');
    if (!container) return;

    if (!posts || posts.length === 0) {
      container.innerHTML = '<li>مقاله‌ای یافت نشد</li>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <li>
        <a href="post.html?slug=${post.slug}">
          ${blogAPI.truncateText(post.title, 60)}
        </a>
      </li>
    `).join('');
  }

  async handleSearch(query) {
    if (!query.trim()) {
      this.clearAllFilters();
      return;
    }

    const filters = { search: query.trim() };
    await this.loadPosts(1, filters);
  }

  async filterByCategory(categoryId) {
    const filters = { category: categoryId };
    await this.loadPosts(1, filters);
  }

  async filterByTag(tagId) {
    const filters = { tag: tagId };
    await this.loadPosts(1, filters);
  }

  async clearAllFilters() {
    // Clear search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    // Remove active states
    document.querySelectorAll('.category-list a, .tag').forEach(item => {
      item.classList.remove('active');
    });

    // Load all posts
    await this.loadPosts(1, {});
  }

  // Utility method to refresh current view
  async refresh() {
    await this.loadPosts(this.currentPage, this.currentFilters);
  }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.blogFrontend = new BlogFrontend();
});

// Handle page visibility change to refresh data
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.blogFrontend) {
    // Refresh data when page becomes visible (user returns to tab)
    setTimeout(() => {
      window.blogFrontend.refresh();
    }, 1000);
  }
});