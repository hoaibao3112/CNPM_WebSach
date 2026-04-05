import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('TacGia', {
    MaTG: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TenTG: { type: DataTypes.STRING(100) },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'tacgia', timestamps: false });
};
