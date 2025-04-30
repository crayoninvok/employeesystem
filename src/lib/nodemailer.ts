import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetPasswordEmail = async (
  to: string,
  token: string,
  name?: string
) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', Arial, sans-serif;
          line-height: 1.6;
          color: #374151;
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
          background-color: #4F46E5;
          padding: 24px;
          text-align: center;
        }
        
        .email-header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        
        .email-body {
          padding: 32px 24px;
          background-color: #ffffff;
        }
        
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1F2937;
        }
        
        .message {
          margin-bottom: 24px;
          font-size: 16px;
        }
        
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transition: background-color 0.3s ease;
        }
        
        .button:hover {
          background-color: #4338CA;
        }
        
        .expiry-note {
          font-size: 14px;
          color: #6B7280;
          margin-top: 16px;
          text-align: center;
        }
        
        .alternative-link {
          margin-top: 16px;
          text-align: center;
          font-size: 14px;
          color: #6B7280;
        }
        
        .email-footer {
          padding: 16px 24px;
          text-align: center;
          background-color: #F9FAFB;
          border-top: 1px solid #E5E7EB;
        }
        
        .footer-text {
          font-size: 14px;
          color: #6B7280;
          margin: 0;
        }
        
        .divider {
          height: 1px;
          background-color: #E5E7EB;
          margin: 24px 0;
        }
        
        .security-note {
          font-size: 14px;
          color: #6B7280;
          background-color: #F3F4F6;
          padding: 16px;
          border-radius: 6px;
          margin-top: 24px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Absenkeun</h1>
        </div>
        
        <div class="email-body">
          <p class="greeting">Halo ${name || "Pengguna"},</p>
          
          <p class="message">Kami menerima permintaan untuk reset password akun Absenkeun Anda. Silakan klik tombol di bawah ini untuk melanjutkan proses reset password.</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
          </div>
          
          <p class="expiry-note">Link reset password ini akan berlaku selama 24 jam.</p>
          
          <div class="alternative-link">
            Jika tombol di atas tidak berfungsi, copy dan paste URL berikut ke browser Anda:<br>
            <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
          </div>
          
          <div class="divider"></div>
          
          <p class="message">Jika Anda tidak meminta reset password ini, Anda dapat mengabaikan email ini dengan aman. Tidak ada perubahan yang akan dilakukan pada akun Anda.</p>
          
          <div class="security-note">
            <strong>Catatan Keamanan:</strong> Absenkeun tidak akan pernah meminta password, informasi kartu kredit, atau informasi pribadi lainnya melalui email.
          </div>
        </div>
        
        <div class="email-footer">
          <p class="footer-text">© ${new Date().getFullYear()} Absenkeun. Seluruh hak cipta dilindungi.</p>
          <p class="footer-text" style="margin-top: 8px;">Email ini dikirim secara otomatis, mohon jangan membalas email ini.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Absenkeun" <${process.env.EMAIL_SENDER}>`,
    to,
    subject: "Reset Password Akun Absenkeun",
    html: htmlContent,
  });
};
