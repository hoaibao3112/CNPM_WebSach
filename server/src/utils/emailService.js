import nodemailer from 'nodemailer';

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Mẫu HTML cải tiến cho email
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f0f2f5;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 40px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background-color: #007bff;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        border-bottom: 2px solid #0056b3;
                    }
                    .header img {
                        max-width: 150px;
                        margin-bottom: 10px;
                    }
                    .content {
                        padding: 30px;
                        text-align: center;
                    }
                    .otp-box {
                        background-color: #e9ecef;
                        padding: 20px;
                        border-radius: 8px;
                        display: inline-block;
                        font-size: 28px;
                        font-weight: bold;
                        color: #dc3545;
                        margin: 20px 0;
                        letter-spacing: 2px;
                        border: 2px dashed #dc3545;
                    }
                    .copy-btn {
                        display: inline-block;
                        margin-top: 10px;
                        padding: 10px 20px;
                        background-color: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-size: 14px;
                    }
                    .copy-btn:hover {
                        background-color: #0056b3;
                    }
                    .footer {
                        text-align: center;
                        padding: 15px;
                        background-color: #f8f9fa;
                        color: #6c757d;
                        font-size: 12px;
                        border-top: 1px solid #dee2e6;
                    }
                    .footer a {
                        color: #007bff;
                        text-decoration: none;
                    }
                    @media (max-width: 480px) {
                        .container { margin: 20px auto; }
                        .content { padding: 15px; }
                        .otp-box { font-size: 22px; padding: 15px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://cdn1.fahasa.com/skin/frontend/ma_vanese/fahasa/images/fahasa-logo.png" alt="Company Logo" />
                        <h2>Xác Nhận Mã OTP</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào, <strong>Bạn</strong>,</p>
                        <p>Cảm ơn bạn đã sử dụng hệ thống của chúng tôi! Dưới đây là mã OTP để đặt lại mật khẩu:</p>
                        <div class="otp-box">${otp}</div>
                        <a href="#" class="copy-btn" onclick="navigator.clipboard.writeText('${otp}');alert('Đã sao chép OTP!');return false;">Sao chép mã</a>
                        <p>Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                        <p>Nếu bạn không yêu cầu mã này, hãy liên hệ với bộ phận hỗ trợ qua <a href="mailto:${process.env.EMAIL_USER}">email hỗ trợ</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Công Ty Bao Store VipPro. Đã đăng ký bản quyền.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã OTP để đặt lại mật khẩu',
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent to người dùng lấy lại mật khẩu:', info.response);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email cho người dùng lấy lại mật khẩu:', {
            message: error.message,
            code: error.code,
            response: error.response,
            responseCode: error.responseCode
        });
        return false;
    }
}