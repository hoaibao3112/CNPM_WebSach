import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('GioHangChiTiet', {
    MaKH: { type: DataTypes.INTEGER, primaryKey: true },
    MaSP: { type: DataTypes.INTEGER, primaryKey: true },
    SoLuong: { type: DataTypes.INTEGER }
  }, { tableName: 'giohang_chitiet', timestamps: false });
};
