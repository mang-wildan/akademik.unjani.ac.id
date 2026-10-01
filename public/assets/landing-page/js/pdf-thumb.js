// Render first (or specified) page of a PDF into canvases with class .pdf-thumb
// Requires pdf.js (pdfjsLib) loaded globally
(function () {
  if (typeof pdfjsLib === 'undefined') return;
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  async function renderThumb(el) {
    const url = el.dataset.url;
    if (!url) return;
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      const requestedPage = parseInt(el.dataset.page || '1', 10);
      const pageNumber = Math.min(pdf.numPages, Math.max(1, requestedPage));
      const page = await pdf.getPage(pageNumber);
      const baseScale = 1.2;
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = baseScale * pixelRatio;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // shrink back for display while keeping high-res pixels
      canvas.style.width = `${viewport.width / pixelRatio}px`;
      canvas.style.height = `${viewport.height / pixelRatio}px`;
      await page.render({ canvasContext: context, viewport }).promise;
      el.innerHTML = '';
      el.appendChild(canvas);
    } catch (e) {
      console.error('PDF render error', e);
      el.innerHTML = '<div class="text-muted">Gagal memuat pratinjau.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pdf-thumb').forEach(renderThumb);
  });
})();

