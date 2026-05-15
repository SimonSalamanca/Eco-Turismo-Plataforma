const nodemailer = require('nodemailer');
const env = require('./env');

let transporter;

const initTransporter = async () => {
  if (env.smtp.host === 'smtp.gmail.com' && env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      }
    });
    console.log('📧 Using Gmail SMTP');
  } else if (env.smtp.host && env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: false,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass
      }
    });
    console.log('📧 Using custom SMTP:', env.smtp.host);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Using Ethereal Email (testing)');
    console.log('   User:', testAccount.user);
    console.log('   Pass:', testAccount.pass);
    console.log('   Preview URL: https://ethereal.email/message');
  }
};

initTransporter();

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: env.smtp.from || 'noreply@ecoturismo.com',
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}`);
    
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Vista previa del correo: ${previewUrl}`);
      }
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${env.frontendUrl}/verify-email/${token}`;
  const html = `
    <h1>Bienvenido a Eco Turismo Experiencial</h1>
    <p>Gracias por registrarte. Por favor verifica tu correo electrónico.</p>
    <a href="${verifyUrl}" style="background: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Verificar correo</a>
    <p>Este enlace expira en 24 horas.</p>
  `;
  return sendEmail(email, 'Verifica tu correo electrónico', html);
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <h1>¡Bienvenido a Eco Turismo Experiencial, ${name}!</h1>
    <p>Gracias por verificar tu correo. Ahora puedes:</p>
    <ul>
      <li>Explorar alojamientos rurales en Colombia</li>
      <li>Reservar experiencias de naturaleza</li>
      <li>Convertirte en anfitrión si tienes un espacio</li>
    </ul>
  `;
  return sendEmail(email, '¡Bienvenido a Eco Turismo Experiencial!', html);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${env.frontendUrl}/reset-password/${token}`;
  const html = `
    <h1>Recuperar contraseña</h1>
    <p>Has solicitado recuperar tu contraseña.</p>
    <a href="${resetUrl}" style="background: #2E7D32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Restablecer contraseña</a>
    <p>Este enlace expira en 1 hora.</p>
  `;
  return sendEmail(email, 'Recuperar contraseña', html);
};

const sendReservationConfirmation = async (email, reservation, listing, user) => {
  const html = `
    <h1>Reserva Confirmada</h1>
    <p>Tu reserva ha sido confirmada exitosamente.</p>
    <h2>Detalles de la reserva:</h2>
    <ul>
      <li><strong>Alojamiento:</strong> ${listing.title}</li>
      <li><strong>Fecha de ingreso:</strong> ${reservation.check_in_date}</li>
      <li><strong>Fecha de salida:</strong> ${reservation.check_out_date}</li>
      <li><strong>Huéspedes:</strong> ${reservation.guests_count}</li>
      <li><strong>Total:</strong> $${reservation.total_amount.toLocaleString('es-CO')}</li>
      <li><strong>Código de confirmación:</strong> ${reservation.confirmation_code}</li>
    </ul>
  `;
  return sendEmail(email, 'Reserva confirmada - Eco Turismo', html);
};

const sendReviewNotification = async (email, listingTitle, rating) => {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const html = `
    <h1>Nueva reseña recibida</h1>
    <p>Has recibido una nueva reseña para <strong>${listingTitle}</strong></p>
    <p>Calificación: ${stars} (${rating}/5)</p>
  `;
  return sendEmail(email, 'Nueva reseña - Eco Turismo', html);
};

const sendAccountBlockedEmail = async (email, name) => {
  const html = `
    <h1>Cuenta bloqueada</h1>
    <p>Hola ${name},</p>
    <p>Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos de inicio de sesión fallidos.</p>
    <p><strong>Duración del bloqueo:</strong> 15 minutos</p>
    <p>Después de este tiempo, podrás intentar iniciar sesión nuevamente.</p>
    <p>Si no fuiste tú quien intentó acceder, por favor contacta a soporte.</p>
  `;
  return sendEmail(email, 'Cuenta bloqueada - Eco Turismo', html);
};

const sendSubscriptionConfirmationEmail = async (email, name, plan, features) => {
  const planNames = { basic: 'Básico', premium: 'Premium', pro: 'Pro' };
  const html = `
    <h1>¡Suscripción activada!</h1>
    <p>Hola ${name},</p>
    <p>Tu plan <strong>${planNames[plan]}</strong> ha sido activado exitosamente.</p>
    <h2>Beneficios de tu plan:</h2>
    <ul>
      ${features.map(f => `<li>${f}</li>`).join('')}
    </ul>
    <p>¡Gracias por confiar en Eco Turismo Experiencial!</p>
  `;
  return sendEmail(email, 'Suscripción activada - Eco Turismo', html);
};

const sendPlanChangeEmail = async (email, name, oldPlan, newPlan, isUpgrade) => {
  const planNames = { basic: 'Básico', premium: 'Premium', pro: 'Pro' };
  const action = isUpgrade ? 'actualizado a' : 'cambiado a';
  const html = `
    <h1>Plan de suscripción ${isUpgrade ? 'actualizado' : 'modificado'}</h1>
    <p>Hola ${name},</p>
    <p>Tu plan ha sido ${action} <strong>${planNames[newPlan]}</strong>.</p>
    <p>Plan anterior: ${planNames[oldPlan]}</p>
    ${!isUpgrade ? '<p>Este cambio se aplicará al finalizar tu período de facturación actual.</p>' : ''}
    <p>Si tienes alguna pregunta, contacta a soporte.</p>
  `;
  return sendEmail(email, `Plan ${isUpgrade ? 'actualizado' : 'modificado'} - Eco Turismo`, html);
};

const sendSubscriptionCancelledEmail = async (email, name, plan, endDate) => {
  const planNames = { basic: 'Básico', premium: 'Premium', pro: 'Pro' };
  const html = `
    <h1>Suscripción cancelada</h1>
    <p>Hola ${name},</p>
    <p>Tu suscripción al plan <strong>${planNames[plan]}</strong> ha sido cancelada.</p>
    <p>Mantendrás tus beneficios hasta el: <strong>${new Date(endDate).toLocaleDateString('es-CO')}</strong></p>
    <p>Si deseas reactivar tu suscripción en el futuro, siempre eres bienvenido de regreso.</p>
  `;
  return sendEmail(email, 'Suscripción cancelada - Eco Turismo', html);
};

module.exports = {
  transporter,
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendReservationConfirmation,
  sendReviewNotification,
  sendAccountBlockedEmail,
  sendSubscriptionConfirmationEmail,
  sendPlanChangeEmail,
  sendSubscriptionCancelledEmail
};