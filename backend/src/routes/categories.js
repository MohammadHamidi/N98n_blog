// routes/categories.js
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Category } = require('../models/Category');

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('نام دسته‌بندی الزامی است')
    .isLength({ max: 50 })
    .withMessage('نام دسته‌بندی نمی‌تواند بیشتر از 50 کاراکتر باشد'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('توضیحات نمی‌تواند بیشتر از 500 کاراکتر باشد')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('postCount')
      .sort('name')
      .lean();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'خطا در دریافت دسته‌بندی‌ها',
      message: error.message
    });
  }
});

// GET /api/categories/:slug - Get single category
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate('postCount');

    if (!category) {
      return res.status(404).json({
        error: 'دسته‌بندی یافت نشد',
        message: 'دسته‌بندی مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'خطا در دریافت دسته‌بندی',
      message: error.message
    });
  }
});

// POST /api/categories - Create new category
router.post('/', validateCategory, handleValidationErrors, async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      description: req.body.description,
      color: req.body.color || '#667eea',
      icon: req.body.icon || 'fas fa-folder'
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'دسته‌بندی با موفقیت ایجاد شد',
      data: category
    });

  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'دسته‌بندی تکراری',
        message: 'دسته‌بندی با این نام قبلاً ایجاد شده است'
      });
    }
    
    res.status(500).json({
      error: 'خطا در ایجاد دسته‌بندی',
      message: error.message
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', [
  param('id').isMongoId().withMessage('شناسه دسته‌بندی نامعتبر است')
], validateCategory, handleValidationErrors, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        icon: req.body.icon
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        error: 'دسته‌بندی یافت نشد',
        message: 'دسته‌بندی مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت به‌روزرسانی شد',
      data: category
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      error: 'خطا در به‌روزرسانی دسته‌بندی',
      message: error.message
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', [
  param('id').isMongoId().withMessage('شناسه دسته‌بندی نامعتبر است')
], handleValidationErrors, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: 'دسته‌بندی یافت نشد',
        message: 'دسته‌بندی مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: 'خطا در حذف دسته‌بندی',
      message: error.message
    });
  }
});

module.exports = router;

