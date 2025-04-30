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

  await transporter.sendMail({
    from: `"Absenkeun" <${process.env.EMAIL_SENDER}>`,
    to,
    subject: "Reset Password Akun Absenkeun",
    html: `
      <p>Halo ${name || ""},</p>
      <p>Kami menerima permintaan untuk reset password akun Anda.</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
    `,
  });
};

