import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('ChatMessage', {
    message_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.INTEGER },
    sender_id: { type: DataTypes.STRING(50) },
    sender_type: { type: DataTypes.ENUM('customer', 'staff', 'admin') },
    message: { type: DataTypes.TEXT },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE },
    read_at: { type: DataTypes.DATE }
  }, { tableName: 'chat_messages', timestamps: false });
};
