import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('OtpRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(100) },
    otp: { type: DataTypes.STRING(10) },
    token: { type: DataTypes.STRING(255) },
    type: { type: DataTypes.STRING(50) },
    created_at: { type: DataTypes.DATE },
    expires_at: { type: DataTypes.DATE }
  }, { tableName: 'otp_requests', timestamps: false });
};
