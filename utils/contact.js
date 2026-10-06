// Link for the contact number in SiteSetting.kontakTelepon. A number the admin
// marks as chat-only ("Chat Only", "WhatsApp", "WA") opens WhatsApp instead of
// dialing it; anything else stays a tel: link.
const WHATSAPP_MARK = /\b(chat|whats\s*app|wa)\b/i;

exports.phoneLink = phone => {
  const text = String(phone || '');
  if (!WHATSAPP_MARK.test(text)) return { href: `tel:${text.replace(/[^\d+]/g, '')}`, whatsapp: false };
  const digits = text.replace(/\D/g, '');
  const intl = digits.startsWith('0') ? `62${digits.slice(1)}` : digits; // wa.me wants the country code, no + or leading 0
  return { href: `https://wa.me/${intl}`, whatsapp: true };
};
