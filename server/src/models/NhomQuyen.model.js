import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('NhomQuyen', {
    MaNQ: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenNQ: { type: DataTypes.STRING(50) },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'nhomquyen', timestamps: false });
};
