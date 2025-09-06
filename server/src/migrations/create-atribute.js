const { Sequelize, DataTypes } = require('sequelize');

// Cấu hình kết nối đến cơ sở dữ liệu
const sequelize = new Sequelize('myweb1', 'root', 'kimloan12345', {
    host: 'localhost',
    port: 3307,
    dialect: 'mysql'
});

// Định nghĩa mô hình cho bảng attributes
const Attribute = sequelize.define('Attribute', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    price: {
        type: DataTypes.STRING,
        allowNull: false
    },
    acreage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    published: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hashtag: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    tableName: 'attributes',
    timestamps: false
});

// Hàm tạo bảng (tương tự "upgrade")
const upgrade = async () => {
    try {
        await sequelize.sync();
        console.log("Table 'attributes' created successfully.");
    } catch (error) {
        console.error("Error creating table:", error);
    }
};

// Hàm xóa bảng (tương tự "downgrade")
const downgrade = async () => {
    try {
        await Attribute.drop();
        console.log("Table 'attributes' dropped successfully.");
    } catch (error) {
        console.error("Error dropping table:", error);
    }
};

// Thực thi việc tạo bảng hoặc xóa bảng tùy theo nhu cầu
(async () => {
    await upgrade(); // Gọi upgrade() để tạo bảng
    // await downgrade(); // Bỏ comment nếu muốn xóa bảng
    await sequelize.close();
})();
