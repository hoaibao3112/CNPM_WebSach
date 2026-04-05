import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('BinhLuan', {
    mabl: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mabl_cha: { type: DataTypes.INTEGER },
    makh: { type: DataTypes.INTEGER },
    masp: { type: DataTypes.INTEGER },
    noidung: { type: DataTypes.TEXT },
    ngaybinhluan: { type: DataTypes.DATE },
    trangthai: { type: DataTypes.ENUM('Hiển thị', 'Ẩn'), defaultValue: 'Hiển thị' }
  }, { tableName: 'binhluan', timestamps: false });
};
