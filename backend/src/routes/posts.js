const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult, param, query } = require('express-validator');
const Post = require('../models/Post');
const { Category, Tag } = require('../models/Category');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های تصویری مجاز هستند'), false);
    }
  }
});

// Validation middleware
const validatePost = [
  body('title')
    .notEmpty()
    .withMessage('عنوان الزامی است')
    .isLength({ max: 200 })
    .withMessage('عنوان نمی‌تواند بیشتر از 200 کاراکتر باشد'),
  body('excerpt')
    .notEmpty()
    .withMessage('خلاصه الزامی است')
    .isLength({ max: 500 })
    .withMessage('خلاصه نمی‌تواند بیشتر از 500 کاراکتر باشد'),
  body('content')
    .notEmpty()
    .withMessage('محتوا الزامی است'),
  body('author.name')
    .notEmpty()
    .withMessage('نام نویسنده الزامی است'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('وضعیت نامعتبر است')
];

// Helper function to handle validation errors
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

// GET /api/posts - Get all published posts with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('صفحه باید عدد مثبت باشد'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('تعداد نتایج باید بین 1 تا 50 باشد'),
  query('category').optional().isMongoId().withMessage('شناسه دسته‌بندی نامعتبر است'),
  query('tag').optional().isMongoId().withMessage('شناسه برچسب نامعتبر است'),
  query('search').optional().isLength({ min: 2 }).withMessage('جستجو باید حداقل 2 کاراکتر باشد')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      sortBy = '-publishedAt'
    } = req.query;

    const query = { status: 'published' };
    
    if (category) query.categories = category;
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };

    const skip = (page - 1) * limit;
    
    const posts = await Post.find(query)
      .populate('categories', 'name slug color')
      .populate('tags', 'name slug color')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      error: 'خطا در دریافت پست‌ها',
      message: error.message
    });
  }
});

// GET /api/posts/featured - Get featured posts
router.get('/featured', async (req, res) => {
  try {
    const featuredPosts = await Post.find({ 
      status: 'published' 
    })
    .populate('categories', 'name slug color')
    .populate('tags', 'name slug color')
    .sort('-views')
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: featuredPosts
    });

  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({
      error: 'خطا در دریافت پست‌های ویژه',
      message: error.message
    });
  }
});

// GET /api/posts/:slug - Get single post by slug
router.get('/:slug', [
  param('slug').notEmpty().withMessage('شناسه پست الزامی است')
], handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findOne({ 
      slug: req.params.slug,
      status: 'published'
    })
    .populate('categories', 'name slug color description')
    .populate('tags', 'name slug color');

    if (!post) {
      return res.status(404).json({
        error: 'پست یافت نشد',
        message: 'پست مورد نظر وجود ندارد یا منتشر نشده است'
      });
    }

    // Increment views
    await post.incrementViews();

    // Get related posts
    const relatedPosts = await Post.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { categories: { $in: post.categories } },
        { tags: { $in: post.tags } }
      ]
    })
    .populate('categories', 'name slug color')
    .populate('tags', 'name slug color')
    .sort('-publishedAt')
    .limit(4)
    .lean();

    res.json({
      success: true,
      data: {
        post,
        relatedPosts
      }
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      error: 'خطا در دریافت پست',
      message: error.message
    });
  }
});
const auth = require('../middleware/auth');
// POST /api/posts - Create new post
router.post(
  '/',
  auth,
  upload.single('featuredImage'),
  async (req, res) => {
    try {
      /* ────── Build the post payload ────── */
      const postData = {
        title:   req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        author: {
          id:    req.user._id,   // added for convenience if you want to reference later
          name:  req.user.name,
          email: req.user.email
        },
        status: req.body.status || 'draft'
      };

      /* ────── Featured image (multipart/form-data) ────── */
      if (req.file) {
        postData.featuredImage = {
          url:      `/uploads/${req.file.filename}`,
          filename: req.file.filename,
          alt:      req.body.imageAlt || postData.title
        };
      }

      /* ────── Categories ────── */
      if (req.body.categories) {
        const categoryIds = Array.isArray(req.body.categories)
          ? req.body.categories
          : req.body.categories.split(',');
        postData.categories = categoryIds;
      }

      /* ────── Tags ────── */
      if (req.body.tags) {
        const tagIds = Array.isArray(req.body.tags)
          ? req.body.tags
          : req.body.tags.split(',');
        postData.tags = tagIds;
      }

      /* ────── SEO (expects a JSON string) ────── */
      if (req.body.seo) {
        postData.seo = JSON.parse(req.body.seo);
      }

      /* ────── Save & populate ────── */
      const post = new Post(postData);
      await post.save();

      const populatedPost = await Post.findById(post._id)
        .populate('categories', 'name slug color')
        .populate('tags', 'name slug color');

      return res.status(201).json({
        success: true,
        message: 'پست با موفقیت ایجاد شد',
        data: populatedPost
      });
    } catch (error) {
      console.error('Error creating post:', error);

      if (error.code === 11000) {
        return res.status(400).json({
          error: 'پست تکراری',
          message: 'پستی با این عنوان قبلاً ایجاد شده است'
        });
      }

      return res.status(500).json({
        error: 'خطا در ایجاد پست',
        message: error.message
      });
    }
  }
);


// PUT /api/posts/:id - Update post
router.put('/:id', [
  param('id').isMongoId().withMessage('شناسه پست نامعتبر است')
], upload.single('featuredImage'), validatePost, handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        error: 'پست یافت نشد',
        message: 'پست مورد نظر وجود ندارد'
      });
    }

    // Update basic fields
    post.title = req.body.title;
    post.excerpt = req.body.excerpt;
    post.content = req.body.content;
    post.author.name = req.body['author.name'];
    post.author.email = req.body['author.email'];
    post.status = req.body.status || post.status;

    // Handle featured image update
    if (req.file) {
      post.featuredImage = {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        alt: req.body.imageAlt || post.title
      };
    }

    // Update categories and tags
    if (req.body.categories) {
      const categoryIds = Array.isArray(req.body.categories) 
        ? req.body.categories 
        : req.body.categories.split(',');
      post.categories = categoryIds;
    }

    if (req.body.tags) {
      const tagIds = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',');
      post.tags = tagIds;
    }

    if (req.body.seo) {
      post.seo = JSON.parse(req.body.seo);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('categories', 'name slug color')
      .populate('tags', 'name slug color');

    res.json({
      success: true,
      message: 'پست با موفقیت به‌روزرسانی شد',
      data: updatedPost
    });

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      error: 'خطا در به‌روزرسانی پست',
      message: error.message
    });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', [
  param('id').isMongoId().withMessage('شناسه پست نامعتبر است')
], handleValidationErrors, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        error: 'پست یافت نشد',
        message: 'پست مورد نظر وجود ندارد'
      });
    }

    res.json({
      success: true,
      message: 'پست با موفقیت حذف شد'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'خطا در حذف پست',
      message: error.message
    });
  }
});

// GET /api/posts/stats/summary - Get blog statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [totalPosts, publishedPosts, draftPosts, totalViews] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: 'draft' }),
      Post.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'خطا در دریافت آمار',
      message: error.message
    });
  }
});

module.exports = router;