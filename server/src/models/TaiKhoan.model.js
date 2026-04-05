import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('TaiKhoan', {
    MaTK: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenTK: { type: DataTypes.STRING(50) },
    MatKhau: { type: DataTypes.STRING(255) },
    MaQuyen: { type: DataTypes.INTEGER },
    NgayTao: { type: DataTypes.DATE },
    TinhTrang: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, { tableName: 'taikhoan', timestamps: false });
};
