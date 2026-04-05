import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('DiaChi', {
    MaDiaChi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MakH: { type: DataTypes.INTEGER },
    TenNguoiNhan: { type: DataTypes.STRING(100) },
    SDT: { type: DataTypes.STRING(15) },
    DiaChiChiTiet: { type: DataTypes.TEXT },
    TinhThanh: { type: DataTypes.STRING(50) },
    QuanHuyen: { type: DataTypes.STRING(50) },
    PhuongXa: { type: DataTypes.STRING(50) },
    MacDinh: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'diachi', timestamps: false });
};
