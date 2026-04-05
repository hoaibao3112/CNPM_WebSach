import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChiTietPhieuNhap', {
    MaPN: { type: DataTypes.INTEGER, primaryKey: true },
    MaSP: { type: DataTypes.INTEGER, primaryKey: true },
    DonGiaNhap: { type: DataTypes.DOUBLE },
    SoLuong: { type: DataTypes.INTEGER },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'chitietphieunhap', timestamps: false });
};
