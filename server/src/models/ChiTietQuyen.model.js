import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChiTietQuyen', {
    MaCTQ: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaQuyen: { type: DataTypes.INTEGER },
    MaCN: { type: DataTypes.INTEGER },
    HanhDong: { type: DataTypes.STRING(255) },
    TinhTrang: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'chitietquyen', timestamps: false });
};
