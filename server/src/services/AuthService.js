import pool from '../config/connectDatabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    async login(username, password) {
        const [accounts] = await pool.query(
            'SELECT * FROM taikhoan WHERE TenTK = ?',
            [username.trim()]
        );

        if (accounts.length === 0) {
            throw new Error('Tên đăng nhập không chính xác');
        }

        const account = accounts[0];

        // Handle BIT(1) type which might be returned as a Buffer or integer
        const isTrue = (val) => {
            if (Buffer.isBuffer(val)) return val[0] === 1 || val[0] === 49; // 1 or '1'
            return val === 1 || val === true || val === '1';
        };

        if (!isTrue(account.TinhTrang)) {
            throw new Error('Tài khoản đã bị khóa');
        }

        let passwordMatch = false;
        const stored = account.MatKhau || '';

        if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
            passwordMatch = await bcrypt.compare(password, stored);
        } else {
            passwordMatch = stored === password;
            if (passwordMatch) {
                // Migrate to hash
                const newHash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE taikhoan SET MatKhau = ? WHERE MaTK = ?', [newHash, account.MaTK]);
                account.MatKhau = newHash;
            }
        }

        if (!passwordMatch) {
            throw new Error('Mật khẩu không chính xác');
        }

        const token = jwt.sign(
            {
                userId: account.MaTK,
                username: account.TenTK,
                role: account.MaQuyen
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        const { MatKhau: _, ...userWithoutPassword } = account;

        return {
            token,
            user: userWithoutPassword,
            expiresIn: 3600
        };
    }

    async customerLogin(email, password) {
        const [[user]] = await pool.query(
            'SELECT makh, tenkh, email, matkhau FROM khachhang WHERE email = ?',
            [email]
        );

        if (!user || !(await bcrypt.compare(password, user.matkhau))) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        const accessToken = generateToken(user.makh, 'customer');
        const refreshToken = generateRefreshToken(user.makh, 'customer');

        return {
            user: { makh: user.makh, tenkh: user.tenkh, email: user.email },
            token: accessToken,
            refreshToken
        };
    }

    // Registration OTP
    async sendOTP(email, tenkh) {
        const [[existing]] = await pool.query('SELECT * FROM khachhang WHERE email = ?', [email]);
        if (existing) throw new Error('Email đã được sử dụng');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO otp_requests (email, otp, token, type) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), token = VALUES(token)',
            [email, otp, token, 'register']
        );

        await sendOTPEmail(email, otp);
        return token;
    }

    async verifyOTP(email, otp, token, type = 'register') {
        const [[otpRecord]] = await pool.query(
            'SELECT * FROM otp_requests WHERE email = ? AND token = ? AND otp = ? AND type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)',
            [email, token, otp, type]
        );

        if (!otpRecord) throw new Error('OTP không hợp lệ hoặc đã hết hạn');

        await pool.query('DELETE FROM otp_requests WHERE email = ? AND token = ?', [email, token]);
        return true;
    }

    async setPassword(data) {
        const { email, tenkh, matkhau, sdt, diachi } = data;
        const hashedPassword = await bcrypt.hash(matkhau, 10);
        const [result] = await pool.query(
            'INSERT INTO khachhang (tenkh, email, matkhau, sdt, diachi) VALUES (?, ?, ?, ?, ?)',
            [tenkh, email, hashedPassword, sdt || null, diachi || null]
        );
        const makh = result.insertId;
        return {
            user: { makh, tenkh, email },
            token: generateToken(makh, 'customer'),
            refreshToken: generateRefreshToken(makh, 'customer')
        };
    }

    // Forgot Password
    async sendForgotOTP(email) {
        const [[user]] = await pool.query('SELECT makh, tenkh FROM khachhang WHERE email = ?', [email]);
        if (!user) throw new Error('Email không tồn tại');

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO otp_requests (email, otp, token, type) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), token = VALUES(token)',
            [email, otp, token, 'forgot-password']
        );

        await sendOTPEmail(email, otp);
        return token;
    }

    async verifyForgotOTP(email, otp, token) {
        await this.verifyOTP(email, otp, token, 'forgot-password');
        const resetToken = crypto.randomBytes(32).toString('hex');
        await pool.query(
            'UPDATE khachhang SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?',
            [resetToken, email]
        );
        return resetToken;
    }

    async resetPassword(email, matkhau, resetToken) {
        const [[user]] = await pool.query(
            'SELECT makh FROM khachhang WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
            [email, resetToken]
        );
        if (!user) throw new Error('Reset token không hợp lệ hoặc đã hết hạn');

        const hashedPassword = await bcrypt.hash(matkhau, 10);
        await pool.query(
            'UPDATE khachhang SET matkhau = ?, reset_token = NULL, reset_token_expires = NULL WHERE makh = ?',
            [hashedPassword, user.makh]
        );
        return true;
    }

    async changePassword(makh, oldPass, newPass) {
        const [[user]] = await pool.query('SELECT matkhau FROM khachhang WHERE makh = ?', [makh]);
        if (!user || !(await bcrypt.compare(oldPass, user.matkhau))) {
            throw new Error('Mật khẩu cũ không đúng');
        }

        const hashed = await bcrypt.hash(newPass, 10);
        await pool.query('UPDATE khachhang SET matkhau = ? WHERE makh = ?', [hashed, makh]);
        return true;
    }

    /**
     * Google OAuth login/registration
     * Verifies Google ID token and creates/logs in user
     */
    async googleAuth(idToken) {
        try {
            // Verify the ID token
            const ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            const googleId = payload['sub'];
            const email = payload['email'];
            const name = payload['name'];
            const picture = payload['picture'];

            console.log('✅ Google token verified:', { email, name, googleId });

            // Check if user exists
            const [[existing]] = await pool.query(
                'SELECT * FROM khachhang WHERE email = ?',
                [email]
            );

            let customer;

            if (existing) {
                // User exists - log in
                customer = existing;
                console.log('User exists, logging in:', email);

                // Update Google ID if not set
                if (!customer.google_id) {
                    await pool.query(
                        'UPDATE khachhang SET google_id = ? WHERE makh = ?',
                        [googleId, customer.makh]
                    );
                }
            } else {
                // User doesn't exist - auto-register
                console.log('New Google user, auto-registering:', email);

                const [result] = await pool.query(
                    `INSERT INTO khachhang (email, tenkh, matkhau, google_id, avatar, ngaythamgia) 
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        email,
                        name || email.split('@')[0],
                        await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10), // Random password
                        googleId,
                        picture || null
                    ]
                );

                const [[newCustomer]] = await pool.query(
                    'SELECT * FROM khachhang WHERE makh = ?',
                    [result.insertId]
                );

                customer = newCustomer;
                console.log('✅ New customer created:', customer.makh);
            }

            // Generate JWT tokens
            const token = jwt.sign(
                {
                    userId: customer.makh,
                    makh: customer.makh,
                    email: customer.email,
                    tenkh: customer.tenkh,
                    userType: 'customer',
                    loyalty_tier: customer.loyalty_tier || 0,
                    loyalty_points: customer.loyalty_points || 0
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            const refreshToken = jwt.sign(
                { userId: customer.makh, userType: 'customer' },
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return {
                token,
                refreshToken,
                user: {
                    makh: customer.makh,
                    email: customer.email,
                    tenkh: customer.tenkh,
                    sdt: customer.sdt,
                    avatar: customer.avatar || picture,
                    loyalty_tier: customer.loyalty_tier || 0,
                    loyalty_points: customer.loyalty_points || 0
                }
            };

        } catch (error) {
            console.error('❌ Google Auth error:', error);
            if (error.message && error.message.includes('Token used too late')) {
                throw new Error('Google token đã hết hạn, vui lòng đăng nhập lại');
            }
            throw new Error('Xác thực Google thất bại: ' + error.message);
        }
    }
}

export default new AuthService();
