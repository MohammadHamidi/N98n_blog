const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام دسته‌بندی الزامی است'],
    trim: true,
    unique: true,
    maxlength: [50, 'نام دسته‌بندی نمی‌تواند بیشتر از 50 کاراکتر باشد']
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'توضیحات نمی‌تواند بیشتر از 500 کاراکتر باشد']
  },
  
  color: {
    type: String,
    default: '#667eea'
  },
  
  icon: {
    type: String,
    default: 'fas fa-folder'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post count
categorySchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'categories',
  count: true
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

// Tag Schema
const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام برچسب الزامی است'],
    trim: true,
    unique: true,
    maxlength: [30, 'نام برچسب نمی‌تواند بیشتر از 30 کاراکتر باشد']
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  color: {
    type: String,
    default: '#6c757d'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post count
tagSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'tags',
  count: true
});

// Pre-save middleware to generate slug
tagSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }
  next();
});

const Tag = mongoose.model('Tag', tagSchema);

module.exports = { Category, Tag };