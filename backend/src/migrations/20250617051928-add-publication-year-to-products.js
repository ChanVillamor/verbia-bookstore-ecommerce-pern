'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the addColumn('publication_year', ...) line from the up migration
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the removeColumn('publication_year') line from the down migration
  }
};
// This migration adds a new column 'publication_year' to the 'products' table.