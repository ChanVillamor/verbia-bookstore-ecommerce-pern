const express = require('express');
const { body, validationResult } = require('express-validator');
const { Product, Category } = require('../models');
const { adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/products';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get all products with categories
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('Fetching all products...');
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          as: 'Categories'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single product by ID
router.get('/:id', adminAuth, async (req, res) => {
  try {
    console.log(`Fetching product with ID: ${req.params.id}`);
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          as: 'Categories'
        }
      ]
    });

    if (!product) {
      console.log('Product not found');
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product found:', product.title);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new product
router.post('/',
  adminAuth,
  upload.single('image'),
  // Normalize category_ids to array before validation
  (req, res, next) => {
    if (typeof req.body.category_ids === 'string') {
      req.body.category_ids = req.body.category_ids.split(',').map(id => id.trim());
    } else if (Array.isArray(req.body.category_ids)) {
      // Already array, do nothing
    } else if (req.body.category_ids) {
      req.body.category_ids = [req.body.category_ids];
    }
    next();
  },
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    body('author')
      .trim()
      .notEmpty()
      .withMessage('Author is required')
      .isLength({ max: 255 })
      .withMessage('Author must be less than 255 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    body('category_ids')
      .isArray()
      .withMessage('Category IDs must be an array'),
    body('publisher')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Publisher must be less than 255 characters'),
    body('publicationYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() })
      .withMessage('Invalid publication year'),
    body('language')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Language must be less than 255 characters'),
    body('pages')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Pages must be a positive integer'),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('featured must be a boolean'),
    body('sale_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Sale price must be a positive number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // If there's a file uploaded but validation failed, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if image file is provided
      if (!req.file) {
        return res.status(400).json({ 
          message: 'Image file is required' 
        });
      }

      const categoryIds = req.body.category_ids;
      const categories = await Category.findAll({
        where: { id: categoryIds }
      });
      if (categories.length !== categoryIds.length) {
        // If there's a file uploaded but some categories not found, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'Some categories not found' });
      }

      // Use the uploaded file path as the image URL
      req.body.image = `/uploads/products/${req.file.filename}`;

      // Convert string boolean to actual boolean
      if (req.body.featured !== undefined) {
        req.body.featured = req.body.featured === 'true';
      }

      // Handle sale_price: Convert empty string or 0 to null
      if (req.body.sale_price !== undefined) {
        const parsedSalePrice = parseFloat(req.body.sale_price);
        req.body.sale_price = isNaN(parsedSalePrice) || parsedSalePrice <= 0 ? null : parsedSalePrice;
      }

      // Trim all string fields
      const stringFields = ['title', 'author', 'description', 'publisher', 'language'];
      stringFields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = req.body[field].trim();
        }
      });

      // Create the product with category association
      const product = await Product.create({
        ...req.body,
        category_ids: categoryIds
      });
      
      // Fetch the product with its categories
      const productWithCategories = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            attributes: ['id', 'name'],
            as: 'Categories'
          }
        ]
      });

      if (!productWithCategories) {
        throw new Error('Failed to create product');
      }

      res.status(201).json(productWithCategories);
    } catch (error) {
      // If there's a file uploaded but error occurred, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error creating product:', error);
      res.status(500).json({ 
        message: 'Error creating product',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update product
router.put('/:id',
  adminAuth,
  upload.single('image'),
  // Normalize category_ids to array before validation
  (req, res, next) => {
    if (typeof req.body.category_ids === 'string') {
      req.body.category_ids = req.body.category_ids.split(',').map(id => id.trim());
    } else if (Array.isArray(req.body.category_ids)) {
      // Already array, do nothing
    } else if (req.body.category_ids) {
      req.body.category_ids = [req.body.category_ids];
    }
    next();
  },
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    body('category_ids')
      .isArray()
      .withMessage('Category IDs must be an array'),
    body('publisher').optional().trim().notEmpty().withMessage('Publisher cannot be empty'),
    body('publicationYear')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() })
      .withMessage('Invalid publication year'),
    body('language')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Language cannot be empty'),
    body('pages')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Pages must be a positive integer'),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean'),
    body('sale_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Sale price must be a positive number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // If there's a file uploaded but validation failed, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByPk(req.params.id);
      if (!product) {
        // If there's a file uploaded but product not found, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'Product not found' });
      }

      const categoryIds = req.body.category_ids;
      const categories = await Category.findAll({
        where: { id: categoryIds }
      });
      if (categories.length !== categoryIds.length) {
        // If there's a file uploaded but some categories not found, remove it
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'Some categories not found' });
      }

      // If new file was uploaded, delete old file and use new path
      if (req.file) {
        // Delete old file if it exists and is in our uploads directory
        if (product.image && product.image.startsWith('/uploads/products/')) {
          const oldFilePath = path.join(process.cwd(), product.image);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        req.body.image = `/uploads/products/${req.file.filename}`;
      }

      // Convert string boolean to actual boolean
      if (req.body.featured !== undefined) {
        req.body.featured = req.body.featured === 'true';
      }

      // Handle sale_price: Convert empty string or 0 to null
      if (req.body.sale_price !== undefined) {
        const parsedSalePrice = parseFloat(req.body.sale_price);
        req.body.sale_price = isNaN(parsedSalePrice) || parsedSalePrice <= 0 ? null : parsedSalePrice;
      }

      // Trim all string fields
      const stringFields = ['title', 'author', 'description', 'publisher', 'language'];
      stringFields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = req.body[field].trim();
        }
      });

      await product.update(req.body);
      // Update product-category associations
      await product.setCategories(categoryIds);
      // Fetch the updated product with categories
      const updatedProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            attributes: ['id', 'name'],
            as: 'Categories'
          }
        ]
      });
      res.json(updatedProduct);
    } catch (error) {
      // If there's a file uploaded but error occurred, remove it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error updating product:', error);
      res.status(500).json({ 
        message: 'Error updating product',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Attempting to delete product:', {
      product_id: req.params.id,
      admin_id: req.user.id
    });

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      console.log('Product not found:', req.params.id);
      return res.status(404).json({ 
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    console.log('Found product:', {
      id: product.id,
      title: product.title,
      image: product.image
    });

    // Delete related records first
    const { OrderDetail, Wishlist, Review } = require('../models');
    
    // Delete order details
    const deletedOrderDetails = await OrderDetail.destroy({
      where: { product_id: req.params.id }
    });
    console.log(`Deleted ${deletedOrderDetails} order details`);

    // Delete wishlist items
    const deletedWishlists = await Wishlist.destroy({
      where: { product_id: req.params.id }
    });
    console.log(`Deleted ${deletedWishlists} wishlist items`);

    // Delete reviews
    const deletedReviews = await Review.destroy({
      where: { product_id: req.params.id }
    });
    console.log(`Deleted ${deletedReviews} reviews`);

    // Delete the product image file if it exists
    if (product.image && product.image.startsWith('/uploads/products/')) {
      const imagePath = path.join(process.cwd(), product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted product image:', imagePath);
      }
    }

    // Now delete the product
    await product.destroy();
    
    console.log('Product deleted successfully:', {
      product_id: req.params.id,
      title: product.title
    });

    res.json({ 
      message: 'Product deleted successfully',
      deleted_product: {
        id: product.id,
        title: product.title
      },
      deleted_related: {
        order_details: deletedOrderDetails,
        wishlist_items: deletedWishlists,
        reviews: deletedReviews
      }
    });
  } catch (error) {
    console.error('Error deleting product:', {
      error: error.message,
      stack: error.stack,
      product_id: req.params.id
    });
    res.status(500).json({ 
      message: 'Error deleting product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 