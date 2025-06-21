"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create join table
    await queryInterface.createTable("product_categories", {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        primaryKey: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
        primaryKey: true,
      },
    });
    // Remove category_id from products
    await queryInterface.removeColumn("products", "category_id");
  },
  down: async (queryInterface, Sequelize) => {
    // Add category_id back to products
    await queryInterface.addColumn("products", "category_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "categories", key: "id" },
      onDelete: "SET NULL",
    });
    // Drop join table
    await queryInterface.dropTable("product_categories");
  },
}; 