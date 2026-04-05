import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('NhaCungCap', {
    MaNCC: { type: DataTypes.STRING(20), primaryKey: true },
    TenNCC: { type: DataTypes.STRING(100) },
    SDT: { type: DataTypes.STRING(15) },
    DiaChi: { type: DataTypes.TEXT },
    TinhTrang: { type: DataTypes.BOOLEAN }
  }, { tableName: 'nhacungcap', timestamps: false });
};
