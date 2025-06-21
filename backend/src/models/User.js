const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order, { 
        foreignKey: 'user_id', 
        as: 'orders',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      User.hasMany(models.Review, { 
        foreignKey: 'user_id', 
        as: 'reviews',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      User.hasMany(models.Wishlist, { 
        foreignKey: 'user_id', 
        as: 'wishlists',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Please enter a valid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.JSONB,
      defaultValue: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        emailNotifications: true,
        smsNotifications: false,
        newsletter: true
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  return User;
};
