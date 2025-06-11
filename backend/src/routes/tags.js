// routes/tags.js
const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Tag } = require('../models/Category');
const auth = require('../middleware/auth'); // ADD THIS LINE


const router = express.Router();

// Validation middleware
const validateTag = [
  body('name')
    .notEmpty()
    .withMessage('نام برچسب الزامی است')
    .isLength({ max: 30 })
    .withMessage('نام برچسب نمی‌تواند بیشتر از 30 کاراکتر باشد')
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

// GET /api/tags - Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find({ isActive: true })
      .populate('postCount')
      .sort('name')
      .lean();

    res.json({
      success: true,
      data: tags
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      error: 'خطا در دریافت برچسب‌ها',
      message: error.message
    });
  }
});

// GET /api/tags/:slug - Get single tag
router.get('/:slug', async (req, res) => {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug, isActive: true })
      .populate('postCount');

    if (!tag) {
      return res.status(404).json({
        error: 'برچسب یافت نشد',
        message: 'برچسب مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      data: tag
    });

  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      error: 'خطا در دریافت برچسب',
      message: error.message
    });
  }
});

// POST /api/tags - Create new tag
router.post('/', auth, validateTag, handleValidationErrors, async (req, res) => {
  try {
    const tag = new Tag({
      name: req.body.name,
      color: req.body.color || '#6c757d'
    });

    await tag.save();

    res.status(201).json({
      success: true,
      message: 'برچسب با موفقیت ایجاد شد',
      data: tag
    });

  } catch (error) {
    console.error('Error creating tag:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'برچسب تکراری',
        message: 'برچسبی با این نام قبلاً ایجاد شده است'
      });
    }
    
    res.status(500).json({
      error: 'خطا در ایجاد برچسب',
      message: error.message
    });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', auth, [
  param('id').isMongoId().withMessage('شناسه برچسب نامعتبر است')
], validateTag, handleValidationErrors, async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        color: req.body.color
      },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({
        error: 'برچسب یافت نشد',
        message: 'برچسب مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      message: 'برچسب با موفقیت به‌روزرسانی شد',
      data: tag
    });

  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      error: 'خطا در به‌روزرسانی برچسب',
      message: error.message
    });
  }
});

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('شناسه برچسب نامعتبر است')
], handleValidationErrors, async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);

    if (!tag) {
      return res.status(404).json({
        error: 'برچسب یافت نشد',
        message: 'برچسب مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      message: 'برچسب با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      error: 'خطا در حذف برچسب',
      message: error.message
    });
  }
});

module.exports = router;