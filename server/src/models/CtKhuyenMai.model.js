import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('CtKhuyenMai', {
    MaCTKM: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaKM: { type: DataTypes.INTEGER },
    GiaTriGiam: { type: DataTypes.DECIMAL(10, 2) },
    GiaTriDonToiThieu: { type: DataTypes.DECIMAL(12, 2) },
    GiamToiDa: { type: DataTypes.DECIMAL(12, 2) },
    SoLuongToiThieu: { type: DataTypes.INTEGER }
  }, { tableName: 'ct_khuyen_mai', timestamps: false });
};
