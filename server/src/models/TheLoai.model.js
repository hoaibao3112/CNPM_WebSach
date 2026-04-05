import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('TheLoai', {
    MaTL: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenTL: { type: DataTypes.STRING(100) },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'theloai', timestamps: false });
};
