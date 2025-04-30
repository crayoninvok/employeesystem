import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/nodemailer";
import { v4 as uuidv4 } from "uuid";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, divisi } = body;

    if (!email || !password || !name || !divisi) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);
    const verificationToken = uuidv4();

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        divisi,
        role: "KARYAWAN",
        emailVerified: null,
        verificationToken,
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifikasi Email</title>
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
        
        .welcome-icon {
          text-align: center;
          margin-bottom: 20px;
          font-size: 48px;
        }

        .next-steps {
          background-color: #F9FAFB;
          border-radius: 6px;
          padding: 16px;
          margin-top: 24px;
        }
        
        .next-steps h3 {
          margin-top: 0;
          color: #1F2937;
          font-size: 16px;
        }
        
        .next-steps ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .next-steps li {
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Absenkeun</h1>
        </div>
        
        <div class="email-body">
          <div class="welcome-icon">👋</div>
          
          <p class="greeting">Halo ${name},</p>
          
          <p class="message">Terima kasih telah mendaftar di Absenkeun! Untuk melanjutkan menggunakan layanan kami, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
          
          <div class="button-container">
            <a href="${verifyUrl}" class="button" target="_blank">Verifikasi Email</a>
          </div>
          
          <div class="alternative-link">
            Jika tombol di atas tidak berfungsi, copy dan paste URL berikut ke browser Anda:<br>
            <a href="${verifyUrl}" style="color: #4F46E5; word-break: break-all;">${verifyUrl}</a>
          </div>
          
          <div class="divider"></div>
          
          <div class="next-steps">
            <h3>Selanjutnya setelah verifikasi:</h3>
            <ul>
              <li>Masuk ke akun Anda dengan email dan password</li>
              <li>Lengkapi profil Anda</li>
              <li>Mulai menggunakan Absenkeun untuk mencatat kehadiran</li>
            </ul>
          </div>
          
          <p class="message" style="margin-top: 24px;">Jika Anda tidak melakukan pendaftaran ini, Anda dapat mengabaikan email ini dengan aman.</p>
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
      to: email,
      subject: "Verifikasi Email Akun Absenkeun",
      html: htmlContent,
    });

    return NextResponse.json(
      { message: "Berhasil mendaftar. Silakan cek email untuk verifikasi." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_KARYAWAN_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
