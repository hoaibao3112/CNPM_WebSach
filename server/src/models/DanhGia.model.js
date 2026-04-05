import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('DanhGia', {
    MaDG: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaSP: { type: DataTypes.INTEGER },
    MaKH: { type: DataTypes.INTEGER },
    SoSao: { type: DataTypes.TINYINT },
    NhanXet: { type: DataTypes.TEXT },
    NgayDanhGia: { type: DataTypes.DATE }
  }, { tableName: 'danhgia', timestamps: false });
};
