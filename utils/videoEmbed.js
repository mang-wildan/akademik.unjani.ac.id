// Turns a YouTube link an admin pastes (watch, youtu.be, shorts, embed) into the privacy-friendly
// embed URL that the strict CSP allows (frame-src youtube-nocookie.com). Any other http(s) URL is
// returned unchanged. A normal watch URL cannot be shown in an iframe, so it must be converted.
const YOUTUBE_ID = /^[\w-]{11}$/;

exports.videoEmbedUrl = raw => {
  let url;
  try {
    url = new URL(String(raw || '').trim());
  } catch {
    return '';
  }
  if (!/^https?:$/.test(url.protocol)) return '';
  const host = url.hostname.replace(/^(www|m)\./, '');
  let id = '';
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, second] = url.pathname.split('/');
    if (kind === 'watch') id = url.searchParams.get('v') || '';
    else if (['embed', 'shorts', 'live', 'v'].includes(kind)) id = second || '';
  } else return url.href;
  return YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : url.href;
};
