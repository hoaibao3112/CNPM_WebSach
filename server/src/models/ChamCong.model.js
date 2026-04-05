import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChamCong', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MaTK: { type: DataTypes.INTEGER },
    ngay: { type: DataTypes.DATEONLY },
    gio_vao: { type: DataTypes.TIME },
    gio_ra: { type: DataTypes.TIME },
    trang_thai: { type: DataTypes.ENUM('Di_lam', 'Nghi_phep', 'Nghi_khong_phep', 'Lam_them', 'Di_tre'), defaultValue: 'Di_lam' },
    ghi_chu: { type: DataTypes.STRING(255) }
  }, { tableName: 'cham_cong', timestamps: false });
};
