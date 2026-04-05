import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('NhanVien', {
    MaNV: { type: DataTypes.STRING(20), primaryKey: true },
    TenNV: { type: DataTypes.STRING(100) },
    GioiTinh: { type: DataTypes.STRING(10) },
    NgaySinh: { type: DataTypes.DATE },
    DiaChi: { type: DataTypes.TEXT },
    SDT: { type: DataTypes.STRING(15) },
    Email: { type: DataTypes.STRING(100) },
    ChucVu: { type: DataTypes.STRING(50) },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'nhanvien', timestamps: false });
};
