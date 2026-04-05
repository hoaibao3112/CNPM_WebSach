import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('HoaDon', {
    MaHD: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    makh: { type: DataTypes.INTEGER },
    NgayLap: { type: DataTypes.DATE },
    TongTien: { type: DataTypes.DOUBLE },
    TrangThai: { type: DataTypes.STRING(50) },
    DiaChiGiao: { type: DataTypes.TEXT },
    SDT: { type: DataTypes.STRING(15) },
    TenNguoiNhan: { type: DataTypes.STRING(100) },
    PhuongThucTT: { type: DataTypes.STRING(50) },
    PhiShip: { type: DataTypes.DOUBLE },
    GhiChu: { type: DataTypes.TEXT },
    MaGiaoDich: { type: DataTypes.STRING(100) },
    TinhThanh: { type: DataTypes.STRING(50) },
    QuanHuyen: { type: DataTypes.STRING(50) },
    PhuongXa: { type: DataTypes.STRING(50) },
    GiamGia: { type: DataTypes.DOUBLE, defaultValue: 0 },
    MaKM: { type: DataTypes.INTEGER },
    loyalty_points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
    loyalty_points_used: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, { tableName: 'hoadon', timestamps: false });
};
