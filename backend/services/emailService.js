const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { frontendUrl, nodeEnv, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, smtpFrom } = require('../config/env');

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPassword) return null;
  return nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpSecure, auth: { user: smtpUser, pass: smtpPassword } });
}

async function sendPasswordResetEmail({ email, name, token }) {
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = getTransporter();
  if (!transporter) {
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      logger.warn('SMTP não configurado; link de recuperação gerado apenas para desenvolvimento.', { resetUrl });
    } else {
      logger.error('SMTP não configurado; recuperação de senha indisponível.');
    }
    return;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Redefina sua senha | HB TECH SOLUTIONS',
    text: `Olá, ${name}. Acesse ${resetUrl} para criar uma nova senha. Este link expira em 1 hora.`,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f8fc;font-family:Arial,sans-serif;color:#102033"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #d7e4f0;border-radius:16px;overflow:hidden"><tr><td style="background:#06172e;padding:28px 32px"><img src="${frontendUrl.replace(/\/$/, '')}/brand/hb-tech-logo.webp" alt="HB Tech Solutions" width="180" style="display:block;max-width:100%;height:auto"><p style="margin:18px 0 0;color:#39d5ff;font-size:11px;font-weight:bold;letter-spacing:2px">HB TECH / FINANCE</p></td></tr><tr><td style="padding:34px 32px"><p style="margin:0 0 10px;color:#0879c4;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">Recuperação de acesso</p><h1 style="margin:0 0 16px;font-size:26px;color:#102033">Crie uma nova senha</h1><p style="font-size:15px;line-height:1.6">Olá, ${name}. Recebemos uma solicitação para redefinir a senha da sua conta.</p><p style="font-size:15px;line-height:1.6">Clique no botão abaixo para continuar. Por segurança, o link expira em 1 hora e pode ser usado uma única vez.</p><p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;background:#0b8fea;color:#06172e;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:8px">Redefinir minha senha</a></p><p style="font-size:12px;line-height:1.6;color:#607086">Se você não solicitou essa alteração, ignore este e-mail. Sua senha continuará a mesma.</p></td></tr><tr><td style="padding:18px 32px;background:#f4f8fc;color:#607086;font-size:11px">HB TECH SOLUTIONS · Ideias que constroem um amanhã mais brilhante.</td></tr></table></td></tr></table></body></html>`
  });
}

module.exports = { sendPasswordResetEmail };