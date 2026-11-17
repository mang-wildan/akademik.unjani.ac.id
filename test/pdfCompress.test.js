const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const childProcess = require('node:child_process');
const { compressPdf } = require('../utils/pdfCompress');

test('compressPdf skips PDFs up to 50 MB', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-compress-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'small.pdf');
  await fs.writeFile(input, '');
  await fs.truncate(input, 50 * 1024 * 1024);
  t.mock.method(console, 'info', () => {});
  const run = t.mock.method(childProcess, 'execFile', () => assert.fail('must not compress'));
  assert.deepEqual(await compressPdf(input), { compressed: false, before: 50 * 1024 * 1024, after: 50 * 1024 * 1024 });
  assert.equal(run.mock.callCount(), 0);
});

for (const outcome of ['smaller', 'larger', 'error', 'timeout', 'missing']) {
  test(`compressPdf preserves original unless output is smaller: ${outcome}`, async t => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-compress-'));
    t.after(() => fs.rm(dir, { recursive: true, force: true }));
    const input = path.join(dir, 'book with spaces.pdf');
    const before = 50 * 1024 * 1024 + 100;
    await fs.writeFile(input, '');
    await fs.truncate(input, before);
    t.mock.method(console, 'info', () => {});
    t.mock.method(console, 'error', () => {});
    t.mock.method(childProcess, 'execFile', (python, args, options, callback) => {
      assert.equal(python, process.env.PDF_PYTHON || 'python3');
      assert.ok(Array.isArray(args));
      assert.equal(args[1], input);
      assert.equal(path.dirname(args[2]), dir);
      assert.notEqual(args[2], input);
      assert.equal(options.timeout, 600000);
      assert.notEqual(options.shell, true);
      fs.writeFile(args[2], '').then(() => fs.truncate(args[2], outcome === 'smaller' ? 50 : before + 20)).then(() => {
        callback(outcome === 'error' ? new Error('exit 2') : outcome === 'timeout' ? Object.assign(new Error('timeout'), { killed: true }) : outcome === 'missing' ? Object.assign(new Error('missing'), { code: 'ENOENT' }) : null);
      });
    });
    assert.deepEqual(await compressPdf(input), { compressed: outcome === 'smaller', before, after: outcome === 'smaller' ? 50 : before });
    assert.equal((await fs.stat(input)).size, outcome === 'smaller' ? 50 : before);
    assert.deepEqual(await fs.readdir(dir), [path.basename(input)]);
  });
}
