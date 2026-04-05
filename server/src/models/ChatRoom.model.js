import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChatRoom', {
    room_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER },
    customer_id: { type: DataTypes.INTEGER },
    staff_id: { type: DataTypes.STRING(10) },
    status: { type: DataTypes.STRING(20), defaultValue: 'active' },
    admin_read_at: { type: DataTypes.DATE },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE }
  }, { tableName: 'chat_rooms', timestamps: false });
};
