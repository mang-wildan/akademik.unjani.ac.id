const test = require('node:test');
const assert = require('node:assert/strict');
const { videoEmbedUrl } = require('../utils/videoEmbed');

const EMBED = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

test('videoEmbedUrl: YouTube links become nocookie embed URLs', () => {
  assert.equal(videoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'), EMBED);
  assert.equal(videoEmbedUrl('https://youtu.be/dQw4w9WgXcQ?si=abc'), EMBED);
  assert.equal(videoEmbedUrl('https://m.youtube.com/shorts/dQw4w9WgXcQ'), EMBED);
  assert.equal(videoEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'), EMBED);
});

test('videoEmbedUrl: other http(s) URLs unchanged, non-http and garbage empty', () => {
  assert.equal(videoEmbedUrl('https://example.com/v.mp4'), 'https://example.com/v.mp4');
  assert.equal(videoEmbedUrl('javascript:alert(1)'), '');
  assert.equal(videoEmbedUrl('bukan url'), '');
  assert.equal(videoEmbedUrl(''), '');
});
