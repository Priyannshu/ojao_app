const config = require('../config');

const WHATSAPP_VERSION = 'v24.0';

function isConfigured() {
  const sms = config.fast2sms;
  return Boolean(sms.apiKey && sms.phoneNumberId && sms.templateName && sms.templateLang);
}

async function sendWhatsappOtp(phone, code) {
  if (!isConfigured()) throw new Error('Fast2SMS WhatsApp delivery is not configured.');

  const destination = phone.length === 10 ? `91${phone}` : phone;
  const response = await fetch(
    `https://www.fast2sms.com/dev/whatsapp/${WHATSAPP_VERSION}/${config.fast2sms.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: config.fast2sms.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: destination,
        type: 'template',
        template: {
          name: config.fast2sms.templateName,
          language: { code: config.fast2sms.templateLang },
          components: [{ type: 'body', parameters: [{ type: 'text', text: code }] }],
        },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.error || data.return === false) {
    const providerMessage = data && (data.error?.message || data.message);
    throw new Error(`Fast2SMS rejected OTP delivery (${response.status}${providerMessage ? `: ${providerMessage}` : ''}).`);
  }
}

module.exports = { sendWhatsappOtp, isConfigured };
