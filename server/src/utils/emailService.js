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

        // Mẫu HTML cho email
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background-color: #007BFF;
                        color: white;
                        text-align: center;
                        padding: 20px;
                    }
                    .header img {
                        max-width: 150px;
                    }
                    .content {
                        padding: 20px;
                        text-align: center;
                    }
                    .otp-box {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        display: inline-block;
                        font-size: 24px;
                        font-weight: bold;
                        color: #dc3545;
                        margin: 20px 0;
                    }
                    .footer {
                        text-align: center;
                        padding: 10px;
                        background-color: #f8f9fa;
                        color: #666;
                        font-size: 12px;
                    }
                    a {
                        color: #007BFF;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <!-- Bạn có thể thêm logo nếu có -->
                        <!-- <img src="https://cdn1.fahasa.com/skin/frontend/ma_vanese/fahasa/images/fahasa-logo.png" alt="Logo"> -->
                        <h2>Xác Nhận Mã OTP</h2>
                    </div>
                    <div class="content">
                        <p>Xin chào,</p>
                        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi! Dưới đây là mã OTP để xác nhận tài khoản của bạn:</p>
                        <div class="otp-box">${otp}</div>
                        <p>Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                        <p>Nếu bạn không yêu cầu mã này, hãy liên hệ với chúng tôi qua <a href="mailto:${process.env.EMAIL_USER}">email hỗ trợ</a>.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Công Ty Bao Stort VipPro (><).</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã OTP để xác nhận tài khoản',
            html: htmlContent // Sử dụng HTML thay vì text
            // text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.` // Giữ text làm fallback (tùy chọn)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Lỗi gửi email:', {
            message: error.message,
            code: error.code,
            response: error.response,
            responseCode: error.responseCode
        });
        return false;
    }
}