import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy mã xác thực (Token)'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Standardize user object
        req.user = {
            userId: decoded.userId || decoded.id || decoded.makh,
            role: decoded.role || decoded.MaQuyen,
            ...decoded
        };
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
        });
    }
};

export { authenticateToken };
