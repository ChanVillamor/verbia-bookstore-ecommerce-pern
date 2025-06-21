const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OrderDetail extends Model {
    static associate(models) {
      OrderDetail.belongsTo(models.Order, { 
        foreignKey: 'order_id', 
        as: 'order',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      OrderDetail.belongsTo(models.Product, { 
        foreignKey: 'product_id', 
        as: 'product',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
  }

  OrderDetail.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Order ID is required'
        }
      }
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'Product ID is required'
        }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        notNull: {
          msg: 'Quantity is required'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        notNull: {
          msg: 'Price is required'
        }
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        notNull: {
          msg: 'Subtotal is required'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'OrderDetail',
    tableName: 'order_details',
    timestamps: true,
    hooks: {
      beforeCreate: async (orderDetail) => {
        // Validate order exists
        const Order = sequelize.models.Order;
        const order = await Order.findByPk(orderDetail.order_id);
        if (!order) {
          throw new Error(`Order with ID ${orderDetail.order_id} does not exist`);
        }

        // Validate product exists and has sufficient stock
        const Product = sequelize.models.Product;
        const product = await Product.findByPk(orderDetail.product_id);
        if (!product) {
          throw new Error(`Product with ID ${orderDetail.product_id} does not exist`);
        }

        if (product.stock < orderDetail.quantity) {
          throw new Error(`Insufficient stock for product ${product.title}`);
        }

        // Calculate subtotal
        orderDetail.subtotal = orderDetail.price * orderDetail.quantity;
      }
    }
  });

  return OrderDetail;
}; 