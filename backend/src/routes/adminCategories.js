const express = require('express');
const { body, validationResult } = require('express-validator');
const { Category } = require('../models');
const { adminAuth } = require('../middleware/auth');
const db = require('../models');

const router = express.Router();

// Get all categories
router.get('/', adminAuth, async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Create new category
router.post('/',
  adminAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('image').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      // Check if category with same name already exists
      const existingCategory = await Category.findOne({
        where: { name: req.body.name }
      });

      if (existingCategory) {
        return res.status(400).json({ 
          message: 'A category with this name already exists',
          code: 'DUPLICATE_CATEGORY'
        });
      }

      const category = await Category.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ 
        message: 'Error creating category',
        error: error.message
      });
    }
  }
);

// Update category
router.put('/:id',
  adminAuth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('image').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const category = await Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ 
          message: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        });
      }

      // If name is being updated, check for duplicates
      if (req.body.name && req.body.name !== category.name) {
        const existingCategory = await Category.findOne({
          where: { name: req.body.name }
        });

        if (existingCategory) {
          return res.status(400).json({ 
            message: 'A category with this name already exists',
            code: 'DUPLICATE_CATEGORY'
          });
        }
      }

      await category.update(req.body);
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ 
        message: 'Error updating category',
        error: error.message
      });
    }
  }
);

// Delete category
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    console.log('Attempting to delete category:', {
      category_id: req.params.id,
      user_id: req.user.id
    });

    const category = await Category.findByPk(req.params.id, {
      include: [{
        model: db.Product,
        as: 'Products',
        attributes: ['id', 'title']
      }]
    });

    if (!category) {
      console.log('Category not found:', req.params.id);
      return res.status(404).json({ 
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    console.log('Found category:', {
      id: category.id,
      name: category.name,
      product_count: category.Products?.length || 0
    });

    // Delete the category (this will cascade delete associated products)
    await category.destroy();
    
    console.log('Category deleted successfully:', {
      category_id: req.params.id,
      name: category.name
    });

    res.json({ 
      message: 'Category deleted successfully',
      deleted_category: {
        id: category.id,
        name: category.name
      }
    });
  } catch (error) {
    console.error('Error deleting category:', {
      error: error.message,
      stack: error.stack,
      category_id: req.params.id
    });

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Cannot delete category because it has associated products',
        code: 'FOREIGN_KEY_CONSTRAINT'
      });
    }

    res.status(500).json({ 
      message: 'Error deleting category',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router; 