import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('SanPham', {
    MaSP: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenSP: { type: DataTypes.STRING(255) },
    MoTa: { type: DataTypes.TEXT },
    DonGia: { type: DataTypes.DOUBLE },
    SoLuong: { type: DataTypes.INTEGER },
    HinhAnh: { type: DataTypes.STRING(255) },
    MaTL: { type: DataTypes.INTEGER },
    MaTG: { type: DataTypes.INTEGER },
    MaNCC: { type: DataTypes.STRING(20) },
    NamXB: { type: DataTypes.INTEGER },
    HinhThuc: { type: DataTypes.STRING(50) },
    SoTrang: { type: DataTypes.INTEGER },
    TrongLuong: { type: DataTypes.INTEGER },
    ISBN: { type: DataTypes.STRING(20) },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, {
    tableName: 'sanpham',
    timestamps: false
  });
};
