import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('KhachHang', {
    makh: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenkh: { type: DataTypes.STRING(100) },
    email: { type: DataTypes.STRING(100) },
    matkhau: { type: DataTypes.STRING(255) },
    sdt: { type: DataTypes.STRING(15) },
    diachi: { type: DataTypes.TEXT },
    avatar: { type: DataTypes.STRING(255) },
    ngaythamgia: { type: DataTypes.DATE },
    tinhtrang: { type: DataTypes.STRING(50) },
    google_id: { type: DataTypes.STRING(100) },
    reset_token: { type: DataTypes.STRING(255) },
    reset_token_expires: { type: DataTypes.DATE },
    loyalty_points: { type: DataTypes.INTEGER, defaultValue: 0 },
    loyalty_tier: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, { tableName: 'khachhang', timestamps: false });
};
