import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('Faq', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    question: { type: DataTypes.STRING(255) },
    answer: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING(100) },
    keywords: { type: DataTypes.JSON },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE }
  }, { tableName: 'faqs', timestamps: false });
};
