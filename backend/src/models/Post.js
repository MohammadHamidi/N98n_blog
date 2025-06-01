const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان پست الزامی است'],
    trim: true,
    maxlength: [200, 'عنوان نمی‌تواند بیشتر از 200 کاراکتر باشد']
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  excerpt: {
    type: String,
    required: [true, 'خلاصه پست الزامی است'],
    trim: true,
    maxlength: [500, 'خلاصه نمی‌تواند بیشتر از 500 کاراکتر باشد']
  },
  
  content: {
    type: String,
    required: [true, 'محتوای پست الزامی است']
  },
  
  author: {
    name: {
      type: String,
      required: [true, 'نام نویسنده الزامی است'],
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  
  featuredImage: {
    url: String,
    alt: String,
    filename: String
  },
  
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  publishedAt: {
    type: Date
  },
  
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  readingTime: {
    type: Number, // in minutes
    default: 0
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
postSchema.index({ slug: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ categories: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'author.name': 1 });
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Virtual for formatted date in Persian
postSchema.virtual('persianDate').get(function() {
  if (this.publishedAt) {
    const date = new Date(this.publishedAt);
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
    return persianDate;
  }
  return null;
});

// Pre-save middleware to generate slug
postSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    // Simple slug generation for Persian text
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '') // Keep Persian and Latin characters
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  
  // Calculate reading time (assuming 200 words per minute for Persian)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Static method to get published posts
postSchema.statics.getPublishedPosts = function(options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    tag, 
    search,
    sortBy = '-publishedAt'
  } = options;
  
  const query = { status: 'published' };
  
  if (category) {
    query.categories = category;
  }
  
  if (tag) {
    query.tags = tag;
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('categories', 'name slug')
    .populate('tags', 'name slug')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);
};

// Instance method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Post', postSchema);