'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Overiew extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Overiew.init({
    code: DataTypes.STRING,
     area: DataTypes.STRING,
    type: DataTypes.STRING,
    target: DataTypes.STRING,
    bonus:DataTypes.STRING,
    created: DataTypes.DATE,
     expire: DataTypes.DATE,
   


  }, {
    sequelize,
    modelName: 'Overiew',
  });
  return Overiew;
};