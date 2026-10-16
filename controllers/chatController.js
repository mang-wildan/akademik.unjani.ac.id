// POST /api/chat: Asisten Akademik. Menjawab pertanyaan umum akademik UNJANI
// dari konten publik situs memakai Gemini (kuota gratis). Semua kegagalan
// dijawab sebagai JSON { error } karena dipanggil lewat fetch dari widget.
const crypto = require('crypto');
const ChatLog = require('../models/ChatLog');
const { parseChatBody, selectItems, buildSystemPrompt, finalizeAnswer } = require('../utils/chat');
const { createLimiter, intFromEnv } = require('../utils/chatLimits');
const { getItems } = require('../utils/chatKnowledge');
const { generate } = require('../utils/gemini');

const limiter = createLimiter({
  ipMax: intFromEnv('CHAT_IP_LIMIT', 10),
  dailyMax: intFromEnv('CHAT_DAILY_LIMIT', 150),
});

const ERRORS = {
  unavailable: 'Asisten belum tersedia. Silakan hubungi Bidang Akademik.',
  ip: 'Terlalu banyak pertanyaan dari perangkat Anda. Coba lagi dalam beberapa menit, atau hubungi Bidang Akademik.',
  daily: 'Asisten sudah mencapai batas pemakaian hari ini. Silakan hubungi Bidang Akademik atau coba lagi besok.',
  failed: 'Asisten sedang tidak dapat menjawab. Silakan coba lagi nanti atau hubungi Bidang Akademik.',
};

// IP tidak disimpan mentah; garam dari JWT_SECRET mencegah pencocokan dengan tabel hash umum.
const hashIp = ip =>
  crypto.createHash('sha256').update(`${process.env.JWT_SECRET || ''}|${ip || ''}`).digest('hex').slice(0, 16);

const record = entry => {
  ChatLog.create(entry).catch(err => {
    // eslint-disable-next-line no-console
    console.error('[chat] gagal mencatat log:', err.name);
  });
};

exports.ask = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const send = (status, payload) => res.status(status).json(payload);

  if (!process.env.GEMINI_API_KEY) return send(503, { error: ERRORS.unavailable });

  const parsed = parseChatBody(req.body);
  if (parsed.error) return send(400, { error: parsed.error });

  const gate = limiter.take(req.ip);
  if (!gate.ok) {
    if (gate.retryAfterSec) res.set('Retry-After', String(gate.retryAfterSec));
    return send(429, { error: ERRORS[gate.reason] });
  }

  const ipHash = hashIp(req.ip);
  try {
    const items = await getItems();
    // Pertanyaan susulan ("kapan?") pendek: kata kunci ikut diambil dari pertanyaan sebelumnya.
    const lastUser = [...parsed.history].reverse().find(row => row.role === 'user');
    const selected = selectItems(items, `${lastUser ? lastUser.text : ''} ${parsed.message}`);
    const raw = await generate({
      system: buildSystemPrompt(selected),
      contents: [...parsed.history, { role: 'user', text: parsed.message }].map(row => ({ role: row.role, parts: [{ text: row.text }] })),
    });
    const { answer, sources } = finalizeAnswer(raw, selected);
    record({ question: parsed.message, answer, sources: sources.map(s => s.url), ipHash });
    return send(200, { answer, sources });
  } catch (err) {
    const code = String((err && err.code) || (err && err.name) || 'unknown').slice(0, 40);
    // eslint-disable-next-line no-console
    console.error('[chat] gagal menjawab:', code, (err && err.status) || '', (err && err.detail) || '');
    record({ question: parsed.message, status: 'error', error: code, ipHash });
    return send(502, { error: ERRORS.failed });
  }
};
