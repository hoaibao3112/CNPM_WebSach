import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = bearerToken || req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy mã xác thực (Token)'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Determine userType safely:
        // role/MaQuyen must be a valid positive integer to be treated as admin
        // This prevents token forgery where attacker sets role: "anything"
        const rawRole = decoded.role ?? decoded.MaQuyen;
        const roleNum = Number(rawRole);
        const hasValidRole = Number.isInteger(roleNum) && roleNum > 0;

        let userType = decoded.userType;
        if (hasValidRole) {
            userType = 'admin';
        } else if (!userType) {
            userType = 'customer';
        }

        // Standardize user object
        req.user = {
            ...decoded,
            userId: decoded.userId || decoded.id || decoded.makh,
            role: hasValidRole ? roleNum : undefined,
            userType: userType,
        };
        next();
    } catch (error) {
        // Distinguish between expired and invalid token for better client UX
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                code: 'TOKEN_EXPIRED',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
            });
        }
        return res.status(403).json({
            success: false,
            code: 'TOKEN_INVALID',
            message: 'Mã xác thực không hợp lệ'
        });
    }
};

export { authenticateToken };
