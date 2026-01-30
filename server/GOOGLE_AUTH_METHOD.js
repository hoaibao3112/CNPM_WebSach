import pool from '../config/connectDatabase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOTPEmail } from '../utils/emailService.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    // ... (keep all existing methods)

    // ADD THIS NEW METHOD at the end of the class:

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
