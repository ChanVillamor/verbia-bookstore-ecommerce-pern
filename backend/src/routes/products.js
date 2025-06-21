const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Product, Category, Review, User } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    console.log('Fetching products with filters:', req.query);

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (minPrice) where.price = { ...where.price, [Op.gte]: minPrice };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: maxPrice };
    if (inStock === 'true') where.stock = { [Op.gt]: 0 };

    // Build include for categories, with optional filter
    const categoryInclude = {
      model: Category,
      as: 'Categories',
      attributes: ['id', 'name'],
      ...(category ? { where: { id: category } } : {})
    };

    const order = [];
    if (sort === 'price_asc') order.push(['price', 'ASC']);
    else if (sort === 'price_desc') order.push(['price', 'DESC']);
    else if (sort === 'newest') order.push(['createdAt', 'DESC']);
    else order.push(['createdAt', 'DESC']);

    const offset = (page - 1) * limit;

    console.log('Query conditions:', { where, order, limit, offset });

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [categoryInclude],
      attributes: [
        'id', 'title', 'author', 'description', 'price', 'sale_price',
        'stock', 'image', 'featured', 'createdAt', 'updatedAt'
      ]
    });

    console.log(`Found ${count} products`);
    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProducts: count
    });
  } catch (error) {
    console.error('Error in GET /products:', error);
    res.status(500).json({ 
      message: 'Error fetching products', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    console.log('Fetching featured products');
    const products = await Product.findAll({
      where: { featured: true },
      include: [
        {
          model: Category,
          as: 'Categories',
          attributes: ['id', 'name']
        }
      ],
      limit: 8
    });
    console.log(`Found ${products.length} featured products`);
    res.json(products);
  } catch (error) {
    console.error('Error in GET /products/featured:', error);
    res.status(500).json({ 
      message: 'Error fetching featured products', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get best-selling products
router.get('/best-selling', async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['sales_count', 'DESC']],
      limit: 8,
      include: [
        {
          model: Category,
          as: 'Categories',
          attributes: ['id', 'name']
        }
      ]
    });
    res.json(products);
  } catch (error) {
    console.error('Error in GET /products/best-selling:', error);
    res.status(500).json({ message: 'Error fetching best-selling products', error: error.message });
  }
});

// Get sale products
router.get('/sale', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { 
        sale_price: { 
          [Op.and]: [
            { [Op.not]: null },
            { [Op.gt]: 0 }
          ]
        } 
      },
      include: [
        {
          model: Category,
          as: 'Categories',
          attributes: ['id', 'name']
        }
      ]
    });
    res.json(products);
  } catch (error) {
    console.error('Error in GET /products/sale:', error);
    res.status(500).json({ message: 'Error fetching sale products', error: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'Categories',
          attributes: ['id', 'name']
        },
        {
          model: Review,
          as: 'Reviews',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error in GET /products/:id:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Get product reviews with pagination
router.get('/:id/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { product_id: req.params.id },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalReviews: count
    });
  } catch (error) {
    console.error('Error in GET /products/:id/reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Add review to product
router.post('/:id/reviews',
  auth,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Comment must not exceed 1000 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const product = await Product.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const review = await Review.create({
        user_id: req.user.id,
        product_id: product.id,
        rating: req.body.rating,
        comment: req.body.comment
      });

      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: 'Error adding review' });
    }
  }
);

module.exports = router; 