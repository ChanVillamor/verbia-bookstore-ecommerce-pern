const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { 
        foreignKey: 'user_id', 
        as: 'user',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      Order.hasMany(models.OrderDetail, { 
        foreignKey: 'order_id', 
        as: 'orderDetails',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      Order.hasOne(models.Payment, { 
        foreignKey: 'order_id', 
        as: 'payment',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'User ID is required'
        }
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Total amount is required'
        },
        min: {
          args: [0],
          msg: 'Total amount must be greater than or equal to 0'
        }
      }
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']],
          msg: 'Invalid status'
        }
      }
    },
    payment_status: {
      type: DataTypes.ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
      ),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'paid', 'failed', 'refunded']],
          msg: 'Invalid payment status'
        }
      }
    },
    payment_intent_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      validate: {
        isValidAddress(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Shipping address must be an object');
          }
          const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
          for (const field of requiredFields) {
            if (!value[field]) {
              throw new Error(`Shipping address ${field} is required`);
            }
          }
        }
      }
    },
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tracking_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estimated_delivery: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.ENUM('stripe', 'paypal', 'mock'),
      allowNull: false,
      defaultValue: 'mock',
      validate: {
        isIn: {
          args: [['stripe', 'paypal', 'mock']],
          msg: 'Invalid payment method'
        }
      }
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Phone number is required' },
        notEmpty: { msg: 'Phone number is required' }
      }
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    hooks: {
      beforeCreate: async (order) => {
        // Ensure total_amount is a number
        if (typeof order.total_amount === 'string') {
          order.total_amount = parseFloat(order.total_amount);
        }

        // Validate user exists
        const User = sequelize.models.User;
        const user = await User.findByPk(order.user_id);
        if (!user) {
          throw new Error(`User with ID ${order.user_id} does not exist`);
        }
      }
    }
  });

  return Order;
}; 