import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('PhieuNhap', {
    MaPN: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaNCC: { type: DataTypes.STRING(20) },
    NgayNhap: { type: DataTypes.DATE },
    TongTien: { type: DataTypes.DOUBLE },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'phieunhap', timestamps: false });
};
