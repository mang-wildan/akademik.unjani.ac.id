// Klien minimal untuk Gemini API (REST, memakai fetch bawaan Node). Kunci API
// dikirim lewat header x-goog-api-key, bukan query string, supaya tidak masuk
// log akses. Pesan error sengaja hanya berisi kode singkat: tidak pernah
// badan respons atau kunci.
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-flash-lite-latest';
const TIMEOUT_MS = 20000;
const MAX_OUTPUT_TOKENS = 600;

class GeminiError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'GeminiError';
    this.code = code;
    this.status = status;
  }
}

const codeForStatus = status => {
  if (status === 429) return 'quota';
  if (status === 400 || status === 404) return 'bad-request'; // termasuk nama model salah
  if (status === 401 || status === 403) return 'auth';
  return 'upstream';
};

// system: string; contents: [{ role: 'user' | 'model', parts: [{ text }] }]
const generate = async ({ system, contents }) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError('no-key');
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let res;
  try {
    res = await fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.2, maxOutputTokens: MAX_OUTPUT_TOKENS },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new GeminiError(err && err.name === 'TimeoutError' ? 'timeout' : 'network');
  }
  if (!res.ok) throw new GeminiError(codeForStatus(res.status), res.status);

  const data = await res.json().catch(() => null);
  const candidate = data && data.candidates && data.candidates[0];
  const text = candidate && candidate.content && candidate.content.parts
    ? candidate.content.parts.map(p => p.text || '').join('').trim()
    : '';
  if (!text) throw new GeminiError(data && data.promptFeedback && data.promptFeedback.blockReason ? 'blocked' : 'empty');
  return text;
};

module.exports = { generate, GeminiError, DEFAULT_MODEL };
