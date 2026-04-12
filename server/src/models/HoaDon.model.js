import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('HoaDon', {
    MaHD: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    makh: { type: DataTypes.INTEGER },
    NgayTao: { type: DataTypes.DATE, field: 'NgayTao' },
    TongTien: { type: DataTypes.DOUBLE },
    tinhtrang: { type: DataTypes.STRING(50), defaultValue: 'Chờ xử lý' },
    MaDiaChi: { type: DataTypes.INTEGER },
    PhuongThucThanhToan: { type: DataTypes.STRING(50), defaultValue: 'COD' },
    GhiChu: { type: DataTypes.TEXT },
    TrangThaiThanhToan: { type: DataTypes.STRING(50), defaultValue: 'Chưa thanh toán' },
    PhiShip: { type: DataTypes.DOUBLE, defaultValue: 0 },
    SoTienHoanTra: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    NgayHoanTien: { type: DataTypes.DATE },
    TrangThaiHoanTien: { type: DataTypes.STRING(50), defaultValue: 'CHUA_HOAN' },
    SoLanHoanTien: { type: DataTypes.INTEGER, defaultValue: 0 },
    TenTK: { type: DataTypes.STRING(20) }
  }, { tableName: 'hoadon', timestamps: false });
};
