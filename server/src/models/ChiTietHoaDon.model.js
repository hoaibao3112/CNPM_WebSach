import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChiTietHoaDon', {
    MaHD: { type: DataTypes.INTEGER, primaryKey: true },
    MaSP: { type: DataTypes.INTEGER, primaryKey: true },
    DonGia: { type: DataTypes.DOUBLE },
    SoLuong: { type: DataTypes.INTEGER }
  }, { tableName: 'chitiethoadon', timestamps: false });
};
