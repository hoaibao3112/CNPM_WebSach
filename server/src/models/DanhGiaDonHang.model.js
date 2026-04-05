import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('DanhGiaDonHang', {
    MaDGHD: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaHD: { type: DataTypes.INTEGER },
    MaKH: { type: DataTypes.INTEGER },
    SoSao: { type: DataTypes.TINYINT },
    NhanXet: { type: DataTypes.TEXT },
    NgayDanhGia: { type: DataTypes.DATE }
  }, { tableName: 'danhgia_donhang', timestamps: false });
};
