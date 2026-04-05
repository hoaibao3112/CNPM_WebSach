import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('KhuyenMai', {
    MaKM: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenKM: { type: DataTypes.STRING(100) },
    MoTa: { type: DataTypes.TEXT },
    LoaiKM: { type: DataTypes.STRING(50) },
    NgayBatDau: { type: DataTypes.DATE },
    NgayKetThuc: { type: DataTypes.DATE },
    TrangThai: { type: DataTypes.BOOLEAN },
    Code: { type: DataTypes.STRING(50) },
    Audience: { type: DataTypes.STRING(50) }
  }, { tableName: 'khuyen_mai', timestamps: false });
};
