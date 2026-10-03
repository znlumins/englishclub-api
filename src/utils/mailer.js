import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_PORT === '465',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

// Kirim email jika SMTP_* sudah diatur di .env, kalau belum fallback log ke console (dev mode)
export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`[MAIL:dev] To: ${to} | Subject: ${subject}\n${text ?? html}`);
    return { sent: false, devMode: true };
  }

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, devMode: false };
}
