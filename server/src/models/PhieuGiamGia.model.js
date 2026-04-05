import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('PhieuGiamGia', {
    MaPhieu: { type: DataTypes.STRING(32), primaryKey: true },
    MaKM: { type: DataTypes.INTEGER },
    MoTa: { type: DataTypes.TEXT },
    SoLanSuDungToiDa: { type: DataTypes.INTEGER, defaultValue: 1 },
    TrangThai: { type: DataTypes.BOOLEAN, defaultValue: true },
    NgayTao: { type: DataTypes.DATE }
  }, { tableName: 'phieugiamgia', timestamps: false });
};
