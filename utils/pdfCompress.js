const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const childProcess = require('node:child_process');

exports.compressPdf = async filePath => {
  let before = 0;
  const temp = path.join(path.dirname(filePath), `.compress-${randomUUID()}.pdf`);
  try {
    before = (await fs.stat(filePath)).size;
    await new Promise((resolve, reject) => {
      childProcess.execFile(process.env.PDF_PYTHON || 'python3', [path.join(__dirname, '../scripts/compress-pdf.py'), filePath, temp], { timeout: 600000 }, err => err ? reject(err) : resolve());
    });
    const after = (await fs.stat(temp)).size;
    if (after > 0 && after < before) {
      await fs.rename(temp, filePath);
      console.info('Kompres PDF Buku Wisuda', { before, after });
      return { compressed: true, before, after };
    }
  } catch (err) {
    console.error('Kompres PDF Buku Wisuda gagal; memakai file asli.', err.message);
  } finally {
    await fs.unlink(temp).catch(err => { if (err.code !== 'ENOENT') console.error('Gagal membersihkan PDF sementara.', err.message); });
  }
  console.info('Kompres PDF Buku Wisuda', { before, after: before });
  return { compressed: false, before, after: before };
};
