const express = require('express');
const bodyParser = require('body-parser');
//const { registerService, loginService } = require('../'); // Giả sử bạn đã tạo các hàm này trong file auth_service.js

const app = express();
app.use(bodyParser.json());  // Middleware để parse JSON

// Đăng ký người dùng
app.post('/register', async (req, res) => {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ err: 1, msg: 'Missing inputs!' });
    }

    try {
        const response = await registerService(req.body);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ err: -1, msg: `Fail at auth controller: ${error.message}` });
    }
});

// Đăng nhập người dùng
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ err: 1, msg: 'Missing inputs!' });
    }

    try {
        const response = await loginService(req.body);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ err: -1, msg: `Fail at auth controller: ${error.message}` });
    }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
