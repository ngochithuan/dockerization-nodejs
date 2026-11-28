import nodemailer from 'nodemailer';

// Gmail SMTP when credentials are configured; otherwise e-mails are logged (dev fallback)
// so every flow can still be exercised without real credentials.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
const smtpEnabled = Boolean(SMTP_USER && SMTP_PASS);

const transport = smtpEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port: Number(SMTP_PORT || 465),
      secure: Number(SMTP_PORT || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendMail({ to, subject, html }) {
  const info = await transport.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, html });
  if (smtpEnabled) {
    console.log(`[notification] sent "${subject}" to ${to} (${info.messageId})`);
  } else {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.log(`[notification] SMTP not configured — would send "${subject}" to ${to}`, links);
  }
}

export async function verifyMailer() {
  if (!smtpEnabled) {
    console.warn('[notification] SMTP_USER/SMTP_PASS not set — e-mails will be logged instead of sent');
    return;
  }
  try {
    await transport.verify();
    console.log('[notification] SMTP connection verified');
  } catch (err) {
    console.error('[notification] SMTP verify failed:', err.message);
  }
}
