import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Hàm tạo OTP (giữ nguyên)
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Hàm gửi email (cập nhật template)
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `Bookstore <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Mã OTP xác thực tài khoản Bookstore',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden;">
          <div style="background: #0066cc; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">BOOKSTORE</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #333;">Xác thực tài khoản</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi đã nhận được yêu cầu xác thực cho tài khoản Bookstore của bạn.</p>
            
            <div style="background: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">Mã OTP của bạn</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #0066cc; margin: 10px 0;">${otp}</div>
              <p style="margin: 0; font-size: 12px; color: #999;">(Có hiệu lực trong 5 phút)</p>
            </div>
            
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br>Đội ngũ Bookstore</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Bookstore. All rights reserved.
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};