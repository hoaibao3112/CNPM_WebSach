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
        
        // Determine userType: prioritize role/MaQuyen presence over token's userType field
        // This handles old tokens that may have incorrect userType stored
        let userType;
        if (decoded.role || decoded.MaQuyen) {
            // Has a role/permission code → always admin
            userType = 'admin';
        } else {
            // Fall back to token's userType, then default to 'customer'
            userType = decoded.userType || 'customer';
        }

        // Standardize user object
        // NOTE: spread decoded first, then override with computed values to avoid decoded overwriting userType
        req.user = {
            ...decoded,
            userId: decoded.userId || decoded.id || decoded.makh,
            role: decoded.role || decoded.MaQuyen,
            userType: userType,
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
