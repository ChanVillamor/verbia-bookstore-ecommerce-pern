const { Product, Category, User } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created:', adminUser.email);

    // Create categories
    console.log('Creating categories...');
    const categories = await Category.bulkCreate([
      { name: 'Fiction' },
      { name: 'Non-Fiction' },
      { name: 'Science Fiction' },
      { name: 'Mystery' },
      { name: 'Romance' }
    ], { returning: true });

    console.log(`Created ${categories.length} categories:`, categories.map(c => c.name));

    if (!categories || categories.length === 0) {
      throw new Error('Failed to create categories');
    }

    // Create products
    console.log('Creating products...');
    const products = await Product.bulkCreate([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
        price: 14.99,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000',
        categoryId: categories[0].id,
        featured: true,
        sales_count: 100
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'The story of racial injustice and the loss of innocence in the American South.',
        price: 12.99,
        stock: 45,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000',
        categoryId: categories[0].id,
        featured: true,
        sales_count: 85
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel and cautionary tale.',
        price: 13.99,
        stock: 40,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000',
        categoryId: categories[2].id,
        featured: true,
        sales_count: 120
      },
      {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        description: 'A romantic novel of manners.',
        price: 11.99,
        stock: 35,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000',
        categoryId: categories[4].id,
        featured: true,
        sales_count: 95
      },
      {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        description: 'A mystery thriller novel.',
        price: 15.99,
        stock: 30,
        image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000',
        categoryId: categories[3].id,
        featured: true,
        sales_count: 150
      }
    ], { returning: true });

    console.log(`Created ${products.length} products:`, products.map(p => p.title));
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error; // Re-throw the error to be handled by the server
  }
};

module.exports = seedDatabase; 