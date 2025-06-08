// Admin Panel Logic
class AdminPanel {
  constructor() {
    this.currentSection = 'dashboard';
    this.currentPost = null;
    this.currentCategory = null;
    this.currentTag = null;
    this.init();
  }

  async init() {
    try {
      if (!blogAPI.getToken()) {
        window.location.href = 'login.html';
        return;
      }
      this.setupEventListeners();
      await this.loadDashboard();
      console.log('✅ Admin panel initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing admin panel:', error);
      ErrorHandler.error('خطا در بارگذاری پنل مدیریت');
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.target.dataset.section;
        this.switchSection(section);
      });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Post Management
    document.getElementById('add-post-btn').addEventListener('click', () => {
      this.openPostModal();
    });

    document.getElementById('post-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePost();
    });

    document.getElementById('cancel-post').addEventListener('click', () => {
      this.closePostModal();
    });

    document.getElementById('post-modal-close').addEventListener('click', () => {
      this.closePostModal();
    });

    // Category Management
    document.getElementById('add-category-btn').addEventListener('click', () => {
      this.openCategoryModal();
    });

    document.getElementById('category-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCategory();
    });

    document.getElementById('cancel-category').addEventListener('click', () => {
      this.closeCategoryModal();
    });

    document.getElementById('category-modal-close').addEventListener('click', () => {
      this.closeCategoryModal();
    });

    // Tag Management
    document.getElementById('add-tag-btn').addEventListener('click', () => {
      this.openTagModal();
    });

    document.getElementById('tag-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTag();
    });

    document.getElementById('cancel-tag').addEventListener('click', () => {
      this.closeTagModal();
    });

    document.getElementById('tag-modal-close').addEventListener('click', () => {
      this.closeTagModal();
    });

    // Image Upload
    this.setupImageUpload();
    this.setupContentImageInsert();

    // Modal Backdrop Close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  }

  setupImageUpload() {
    const uploadArea = document.getElementById('image-upload');
    const fileInput = document.getElementById('featured-image');
    const imagePreview = document.getElementById('image-preview');

    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        fileInput.files = files;
        this.previewImage(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.previewImage(e.target.files[0]);
      }
    });
  }

  previewImage(file) {
    const reader = new FileReader();
    const imagePreview = document.getElementById('image-preview');
    
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
  }

  setupContentImageInsert() {
    const btn = document.getElementById('insert-image-btn');
    const fileInput = document.getElementById('content-image-file');
    const textarea = document.getElementById('post-content');

    if (!btn || !fileInput || !textarea) return;

    btn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      if (!e.target.files.length) return;
      const file = e.target.files[0];
      try {
        const res = await blogAPI.uploadImage(file);
        if (res.success && res.url) {
          this.insertAtCursor(textarea, `![](${res.url})\n`);
          ErrorHandler.success('تصویر افزوده شد');
        } else {
          throw new Error(res.error || 'خطا در بارگذاری تصویر');
        }
      } catch (err) {
        ErrorHandler.error(err.message);
      }
      fileInput.value = '';
    });
  }

  insertAtCursor(el, text) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    el.value = before + text + after;
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
  }

  async switchSection(section) {
    // Update navigation
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.admin-section').forEach(sec => {
      sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    this.currentSection = section;

    // Load section data
    try {
      switch (section) {
        case 'dashboard':
          await this.loadDashboard();
          break;
        case 'posts':
          await this.loadPosts();
          break;
        case 'categories':
          await this.loadCategories();
          break;
        case 'tags':
          await this.loadTags();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${section}:`, error);
      ErrorHandler.error(`خطا در بارگذاری ${this.getSectionTitle(section)}`);
    }
  }

  getSectionTitle(section) {
    const titles = {
      'dashboard': 'داشبورد',
      'posts': 'مقالات',
      'categories': 'دسته‌بندی‌ها',
      'tags': 'برچسب‌ها'
    };
    return titles[section] || section;
  }

  async loadDashboard() {
    try {
      loadingManager.show('dashboard');
      
      const response = await blogAPI.getPostStats();
      
      if (response.success) {
        const stats = response.data;
        
        document.getElementById('total-posts').textContent = stats.totalPosts || 0;
        document.getElementById('published-posts').textContent = stats.publishedPosts || 0;
        document.getElementById('draft-posts').textContent = stats.draftPosts || 0;
        document.getElementById('total-views').textContent = stats.totalViews || 0;
      }

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Set default values on error
      document.getElementById('total-posts').textContent = '0';
      document.getElementById('published-posts').textContent = '0';
      document.getElementById('draft-posts').textContent = '0';
      document.getElementById('total-views').textContent = '0';
    } finally {
      loadingManager.hide('dashboard');
    }
  }

  async loadPosts() {
    try {
      loadingManager.show('posts');
      
      const response = await blogAPI.getPosts({ limit: 50 });
      
      if (response.success) {
        this.renderPostsTable(response.data.posts);
      } else {
        throw new Error('Failed to load posts');
      }

    } catch (error) {
      console.error('Error loading posts:', error);
      document.getElementById('posts-table-body').innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #dc3545;">
            خطا در بارگذاری مقالات
          </td>
        </tr>
      `;
    } finally {
      loadingManager.hide('posts');
    }
  }

  renderPostsTable(posts) {
    const tbody = document.getElementById('posts-table-body');
    
    if (!posts || posts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: #6c757d;">
            هیچ مقاله‌ای یافت نشد
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = posts.map(post => `
      <tr>
        <td>
          <strong>${post.title}</strong>
          <br>
          <small style="color: #6c757d;">${blogAPI.truncateText(post.excerpt, 60)}</small>
        </td>
        <td>${post.author.name}</td>
        <td>
          <span class="status-badge status-${post.status}">
            ${this.getStatusText(post.status)}
          </span>
        </td>
        <td>${blogAPI.formatPersianDate(post.publishedAt || post.createdAt)}</td>
        <td>${post.views || 0}</td>
        <td>
          <button class="btn btn-success btn-sm" onclick="admin.editPost('${post._id}')" style="margin: 0 0.25rem; padding: 0.25rem 0.5rem; font-size: 0.8rem;">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="admin.deletePost('${post._id}')" style="margin: 0 0.25rem; padding: 0.25rem 0.5rem; font-size: 0.8rem;">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  getStatusText(status) {
    const statusTexts = {
      'published': 'منتشر شده',
      'draft': 'پیش‌نویس',
      'archived': 'آرشیو شده'
    };
    return statusTexts[status] || status;
  }

  async loadCategories() {
    try {
      loadingManager.show('categories');
      
      const response = await blogAPI.getCategories();
      
      if (response.success) {
        this.renderCategories(response.data);
      } else {
        throw new Error('Failed to load categories');
      }

    } catch (error) {
      console.error('Error loading categories:', error);
      document.getElementById('categories-list').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #dc3545;">
          خطا در بارگذاری دسته‌بندی‌ها
        </div>
      `;
    } finally {
      loadingManager.hide('categories');
    }
  }

  renderCategories(categories) {
    const container = document.getElementById('categories-list');
    
    if (!categories || categories.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #6c757d;">
          هیچ دسته‌بندی‌ای یافت نشد
        </div>
      `;
      return;
    }

    container.innerHTML = categories.map(category => `
      <div class="stat-card" style="background: ${category.color || '#667eea'}; position: relative;">
        <div style="position: absolute; top: 0.5rem; left: 0.5rem; display: flex; gap: 0.25rem;">
          <button onclick="admin.editCategory('${category._id}')" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="admin.deleteCategory('${category._id}')" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem; border-radius: 4px; cursor: pointer;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <i class="${category.icon || 'fas fa-folder'}" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <h3>${category.name}</h3>
        <p>${category.postCount || 0} مقاله</p>
        ${category.description ? `<small style="opacity: 0.8;">${blogAPI.truncateText(category.description, 50)}</small>` : ''}
      </div>
    `).join('');
  }

  async loadTags() {
    try {
      loadingManager.show('tags');
      
      const response = await blogAPI.getTags();
      
      if (response.success) {
        this.renderTags(response.data);
      } else {
        throw new Error('Failed to load tags');
      }

    } catch (error) {
      console.error('Error loading tags:', error);
      document.getElementById('tags-list').innerHTML = `
        <span style="color: #dc3545;">خطا در بارگذاری برچسب‌ها</span>
      `;
    } finally {
      loadingManager.hide('tags');
    }
  }

  renderTags(tags) {
    const container = document.getElementById('tags-list');
    
    if (!tags || tags.length === 0) {
      container.innerHTML = `
        <span style="color: #6c757d;">هیچ برچسبی یافت نشد</span>
      `;
      return;
    }

    container.innerHTML = tags.map(tag => `
      <span class="tag" style="background: ${tag.color || '#6c757d'}; color: white; position: relative; padding-left: 3rem;">
        ${tag.name}
        <span style="position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); display: flex; gap: 0.25rem;">
          <button onclick="admin.editTag('${tag._id}')" style="background: none; border: none; color: white; cursor: pointer; font-size: 0.7rem;">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="admin.deleteTag('${tag._id}')" style="background: none; border: none; color: white; cursor: pointer; font-size: 0.7rem;">
            <i class="fas fa-trash"></i>
          </button>
        </span>
      </span>
    `).join('');
  }

  // Post Management
  openPostModal(post = null) {
    this.currentPost = post;
    const modal = document.getElementById('post-modal');
    const title = document.getElementById('post-modal-title');
    
    if (post) {
      title.textContent = 'ویرایش مقاله';
      this.fillPostForm(post);
    } else {
      title.textContent = 'افزودن مقاله جدید';
      this.clearPostForm();
    }
    
    modal.classList.add('active');
  }

  closePostModal() {
    document.getElementById('post-modal').classList.remove('active');
    this.currentPost = null;
    this.clearPostForm();
  }

  fillPostForm(post) {
    document.getElementById('post-id').value = post._id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-excerpt').value = post.excerpt;
    document.getElementById('post-content').value = post.content;
    document.getElementById('author-name').value = post.author.name;
    document.getElementById('author-email').value = post.author.email || '';
    document.getElementById('post-status').value = post.status;
    
    if (post.featuredImage?.url) {
      const imagePreview = document.getElementById('image-preview');
      imagePreview.src = post.featuredImage.url;
      imagePreview.style.display = 'block';
    }
  }

  clearPostForm() {
    document.getElementById('post-form').reset();
    document.getElementById('post-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
  }

  async savePost() {
    try {
      loadingManager.show('save-post');
      
      const formData = new FormData();
      const postId = document.getElementById('post-id').value;
      
      // Add form fields
      formData.append('title', document.getElementById('post-title').value);
      formData.append('excerpt', document.getElementById('post-excerpt').value);
      formData.append('content', document.getElementById('post-content').value);
      formData.append('author.name', document.getElementById('author-name').value);
      formData.append('author.email', document.getElementById('author-email').value);
      formData.append('status', document.getElementById('post-status').value);
      
      // Add image if selected
      const imageFile = document.getElementById('featured-image').files[0];
      if (imageFile) {
        formData.append('featuredImage', imageFile);
      }

      let response;
      if (postId) {
        // Update existing post
        response = await blogAPI.updatePost(postId, formData);
      } else {
        // Create new post
        response = await blogAPI.createPost(formData);
      }

      if (response.success) {
        ErrorHandler.success(postId ? 'مقاله با موفقیت به‌روزرسانی شد' : 'مقاله با موفقیت ایجاد شد');
        this.closePostModal();
        await this.loadPosts();
        await this.loadDashboard();
      } else {
        throw new Error(response.message || 'خطا در ذخیره مقاله');
      }

    } catch (error) {
      console.error('Error saving post:', error);
      ErrorHandler.error(error.message || 'خطا در ذخیره مقاله');
    } finally {
      loadingManager.hide('save-post');
    }
  }

  async editPost(postId) {
    try {
      loadingManager.show('edit-post');
      
      const response = await blogAPI.fetch(`/posts/${postId}`);
      
      if (response.success) {
        this.openPostModal(response.data.post);
      } else {
        throw new Error('Post not found');
      }

    } catch (error) {
      console.error('Error loading post for edit:', error);
      ErrorHandler.error('خطا در بارگذاری مقاله');
    } finally {
      loadingManager.hide('edit-post');
    }
  }

  async deletePost(postId) {
    if (!confirm('آیا از حذف این مقاله اطمینان دارید؟')) return;

    try {
      loadingManager.show('delete-post');
      
      const response = await blogAPI.deletePost(postId);
      
      if (response.success) {
        ErrorHandler.success('مقاله با موفقیت حذف شد');
        await this.loadPosts();
        await this.loadDashboard();
      } else {
        throw new Error(response.message || 'خطا در حذف مقاله');
      }

    } catch (error) {
      console.error('Error deleting post:', error);
      ErrorHandler.error(error.message || 'خطا در حذف مقاله');
    } finally {
      loadingManager.hide('delete-post');
    }
  }

  // Category Management
  openCategoryModal(category = null) {
    this.currentCategory = category;
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    
    if (category) {
      title.textContent = 'ویرایش دسته‌بندی';
      this.fillCategoryForm(category);
    } else {
      title.textContent = 'افزودن دسته‌بندی جدید';
      this.clearCategoryForm();
    }
    
    modal.classList.add('active');
  }

  closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
    this.currentCategory = null;
    this.clearCategoryForm();
  }

  fillCategoryForm(category) {
    document.getElementById('category-id').value = category._id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    document.getElementById('category-color').value = category.color || '#667eea';
    document.getElementById('category-icon').value = category.icon || 'fas fa-folder';
  }

  clearCategoryForm() {
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('category-color').value = '#667eea';
    document.getElementById('category-icon').value = 'fas fa-folder';
  }

  async saveCategory() {
    try {
      loadingManager.show('save-category');
      
      const categoryId = document.getElementById('category-id').value;
      const data = {
        name: document.getElementById('category-name').value,
        description: document.getElementById('category-description').value,
        color: document.getElementById('category-color').value,
        icon: document.getElementById('category-icon').value
      };

      let response;
      if (categoryId) {
        response = await blogAPI.updateCategory(categoryId, data);
      } else {
        response = await blogAPI.createCategory(data);
      }

      if (response.success) {
        ErrorHandler.success(categoryId ? 'دسته‌بندی با موفقیت به‌روزرسانی شد' : 'دسته‌بندی با موفقیت ایجاد شد');
        this.closeCategoryModal();
        await this.loadCategories();
      } else {
        throw new Error(response.message || 'خطا در ذخیره دسته‌بندی');
      }

    } catch (error) {
      console.error('Error saving category:', error);
      ErrorHandler.error(error.message || 'خطا در ذخیره دسته‌بندی');
    } finally {
      loadingManager.hide('save-category');
    }
  }

  async editCategory(categoryId) {
    try {
      loadingManager.show('edit-category');
      
      const response = await blogAPI.getCategory(categoryId);
      
      if (response.success) {
        this.openCategoryModal(response.data);
      } else {
        throw new Error('Category not found');
      }

    } catch (error) {
      console.error('Error loading category for edit:', error);
      ErrorHandler.error('خطا در بارگذاری دسته‌بندی');
    } finally {
      loadingManager.hide('edit-category');
    }
  }

  async deleteCategory(categoryId) {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;

    try {
      loadingManager.show('delete-category');
      
      const response = await blogAPI.deleteCategory(categoryId);
      
      if (response.success) {
        ErrorHandler.success('دسته‌بندی با موفقیت حذف شد');
        await this.loadCategories();
      } else {
        throw new Error(response.message || 'خطا در حذف دسته‌بندی');
      }

    } catch (error) {
      console.error('Error deleting category:', error);
      ErrorHandler.error(error.message || 'خطا در حذف دسته‌بندی');
    } finally {
      loadingManager.hide('delete-category');
    }
  }

  // Tag Management
  openTagModal(tag = null) {
    this.currentTag = tag;
    const modal = document.getElementById('tag-modal');
    const title = document.getElementById('tag-modal-title');
    
    if (tag) {
      title.textContent = 'ویرایش برچسب';
      this.fillTagForm(tag);
    } else {
      title.textContent = 'افزودن برچسب جدید';
      this.clearTagForm();
    }
    
    modal.classList.add('active');
  }

  closeTagModal() {
    document.getElementById('tag-modal').classList.remove('active');
    this.currentTag = null;
    this.clearTagForm();
  }

  fillTagForm(tag) {
    document.getElementById('tag-id').value = tag._id;
    document.getElementById('tag-name').value = tag.name;
    document.getElementById('tag-color').value = tag.color || '#6c757d';
  }

  clearTagForm() {
    document.getElementById('tag-form').reset();
    document.getElementById('tag-id').value = '';
    document.getElementById('tag-color').value = '#6c757d';
  }

  async saveTag() {
    try {
      loadingManager.show('save-tag');
      
      const tagId = document.getElementById('tag-id').value;
      const data = {
        name: document.getElementById('tag-name').value,
        color: document.getElementById('tag-color').value
      };

      let response;
      if (tagId) {
        response = await blogAPI.updateTag(tagId, data);
      } else {
        response = await blogAPI.createTag(data);
      }

      if (response.success) {
        ErrorHandler.success(tagId ? 'برچسب با موفقیت به‌روزرسانی شد' : 'برچسب با موفقیت ایجاد شد');
        this.closeTagModal();
        await this.loadTags();
      } else {
        throw new Error(response.message || 'خطا در ذخیره برچسب');
      }

    } catch (error) {
      console.error('Error saving tag:', error);
      ErrorHandler.error(error.message || 'خطا در ذخیره برچسب');
    } finally {
      loadingManager.hide('save-tag');
    }
  }

  async editTag(tagId) {
    try {
      loadingManager.show('edit-tag');
      
      const response = await blogAPI.getTag(tagId);
      
      if (response.success) {
        this.openTagModal(response.data);
      } else {
        throw new Error('Tag not found');
      }

    } catch (error) {
      console.error('Error loading tag for edit:', error);
      ErrorHandler.error('خطا در بارگذاری برچسب');
    } finally {
      loadingManager.hide('edit-tag');
    }
  }

  async deleteTag(tagId) {
    if (!confirm('آیا از حذف این برچسب اطمینان دارید؟')) return;

    try {
      loadingManager.show('delete-tag');
      
      const response = await blogAPI.deleteTag(tagId);
      
      if (response.success) {
        ErrorHandler.success('برچسب با موفقیت حذف شد');
        await this.loadTags();
      } else {
        throw new Error(response.message || 'خطا در حذف برچسب');
      }

    } catch (error) {
      console.error('Error deleting tag:', error);
      ErrorHandler.error(error.message || 'خطا در حذف برچسب');
    } finally {
      loadingManager.hide('delete-tag');
    }
  }

  logout() {
    blogAPI.removeToken();
    window.location.href = 'login.html';
  }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.admin = new AdminPanel();
});