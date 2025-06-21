'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First, remove the existing foreign key constraint if it exists
      await queryInterface.removeConstraint('products', 'products_category_id_fkey');
    } catch (error) {
      console.log('Constraint might not exist, continuing...');
    }

    // Then add the new foreign key constraint with CASCADE
    await queryInterface.addConstraint('products', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'products_category_id_fkey',
      references: {
        table: 'categories',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the CASCADE constraint
      await queryInterface.removeConstraint('products', 'products_category_id_fkey');
    } catch (error) {
      console.log('Constraint might not exist, continuing...');
    }

    // Add back the original RESTRICT constraint
    await queryInterface.addConstraint('products', {
      fields: ['category_id'],
      type: 'foreign key',
      name: 'products_category_id_fkey',
      references: {
        table: 'categories',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  }
}; 