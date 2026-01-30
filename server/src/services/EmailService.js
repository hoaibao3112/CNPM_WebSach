import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class EmailService {
    async sendOTP(email, otp) {
        const mailOptions = {
            from: `Bookstore <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Mã OTP xác nhận',
            html: `<p>Mã OTP của bạn là: <strong>${otp}</strong></p>`
        };
        return await transporter.sendMail(mailOptions);
    }
}

export default new EmailService();
