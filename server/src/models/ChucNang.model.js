import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChucNang', {
    MaCN: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenCN: { type: DataTypes.STRING(50) },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'chucnang', timestamps: false });
};
