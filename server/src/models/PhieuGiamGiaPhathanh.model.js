import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('PhieuGiamGiaPhathanh', {
    MaPhatHanh: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    makh: { type: DataTypes.INTEGER },
    MaPhieu: { type: DataTypes.STRING(32) },
    NgayPhatHanh: { type: DataTypes.DATE },
    NgaySuDung: { type: DataTypes.DATE },
    TrangThaiSuDung: { type: DataTypes.STRING(20) }
  }, { tableName: 'phieugiamgia_phathanh', timestamps: false });
};
