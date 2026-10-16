/*
 * UI behaviour for the new layouts. Loaded before the Alpine CSP build, which
 * cannot evaluate inline JavaScript: every component is registered here and
 * templates only reference its properties and methods by name.
 */
document.addEventListener('alpine:init', () => {
  // Disclosure: mobile menu, admin sidebar, dropdowns, "⋯" menus.
  window.Alpine.data('disclosure', () => ({
    open: false,
    toggle() {
      this.open = !this.open;
      // Off-canvas panels (admin sidebar) mark their first control x-ref="focusOnOpen".
      if (this.open && this.$refs.focusOnOpen) this.$nextTick(() => this.$refs.focusOnOpen.focus());
    },
    close() {
      this.open = false;
    },
    closeAndFocus() {
      if (!this.open) return;
      this.open = false;
      if (this.$refs.trigger) this.$refs.trigger.focus();
    },
    // Escape for a menu nested inside another disclosure: only swallow the key
    // when this menu is open, so a closed menu lets it reach the outer panel.
    escapeIfOpen(event) {
      if (!this.open) return;
      event.stopPropagation();
      this.closeAndFocus();
    },
  }));

  // Tabs with arrow-key navigation (WAI-ARIA tabs pattern).
  // Slideshow Unit Kerja (Beranda). Gulir & geser = CSS scroll-snap; di sini hanya tombol dan autoplay.
  // Autoplay ±5 dtk: berhenti saat kursor/fokus di dalam, saat tab tersembunyi, dan mati bila prefers-reduced-motion.
  window.Alpine.data('carousel', () => ({
    playing: true,
    canScroll: false,
    held: false,
    timer: null,
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    get centerClass() {
      return this.canScroll ? '' : 'justify-center'; // sedikit unit: kartu di tengah; banyak: mulai dari kiri agar bisa digulir
    },
    get toggleLabel() {
      return this.playing ? 'Jeda slideshow' : 'Putar slideshow';
    },
    init() {
      this.playing = !this.reduced;
      this.measure();
      window.addEventListener('resize', () => this.measure());
      this.timer = setInterval(() => {
        if (this.playing && this.canScroll && !this.held && !document.hidden) this.next();
      }, 5000);
    },
    destroy() {
      clearInterval(this.timer);
    },
    measure() {
      const t = this.$refs.track;
      this.canScroll = t.scrollWidth > t.clientWidth + 4;
    },
    step() {
      const card = this.$refs.track.firstElementChild;
      return card.offsetWidth + parseFloat(getComputedStyle(this.$refs.track).columnGap || 0);
    },
    go(left) {
      this.$refs.track.scrollTo({ left, behavior: this.reduced ? 'auto' : 'smooth' });
    },
    next() {
      const t = this.$refs.track;
      this.go(t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 ? 0 : t.scrollLeft + this.step());
    },
    prev() {
      const t = this.$refs.track;
      this.go(t.scrollLeft <= 4 ? t.scrollWidth : t.scrollLeft - this.step());
    },
    toggle() {
      this.playing = !this.playing;
    },
    hold() {
      this.held = true;
    },
    release() {
      this.held = false;
    },
  }));

  window.Alpine.data('tabs', () => ({
    active: 0,
    init() {
      const initial = Number(this.$el.dataset.active || 0);
      this.active = Number.isInteger(initial) ? initial : 0;
    },
    select(event) {
      this.active = Number(event.currentTarget.dataset.index);
    },
    isActive() {
      return Number(this.$el.dataset.index) === this.active;
    },
    tabIndex() {
      return this.isActive() ? 0 : -1;
    },
    move(event) {
      const tabs = [...this.$root.querySelectorAll('[role="tab"]')];
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      this.active = (this.active + step + tabs.length) % tabs.length;
      tabs[this.active].focus();
    },
  }));

  // Minimal rich-text editor: contenteditable + toolbar, no dependency.
  // Server-side sanitizeHtml() is the real guard (NFR-S-06); this is only
  // for the admin's writing experience.
  window.Alpine.data('richtext', () => ({
    // Alpine's CSP build blocks property assignment (e.g. `.innerHTML = …`)
    // from template expressions like x-init; doing it here, inside a real
    // method, is unrestricted and runs once when the component mounts.
    init() {
      this.$refs.editor.innerHTML = this.$refs.hidden.value;
    },
    exec(event) {
      const btn = event.currentTarget;
      document.execCommand(btn.dataset.cmd, false, btn.dataset.value || null);
      this.sync();
      this.$refs.editor.focus();
    },
    // Link UI: the inline URL field steals focus, so remember the selection when it opens.
    linkOpen: false,
    linkError: '',
    saved: null,
    openLink() {
      const sel = window.getSelection();
      this.saved = sel.rangeCount && this.$refs.editor.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
      this.linkOpen = true;
      this.linkError = '';
      this.$nextTick(() => this.$refs.linkUrl.focus());
    },
    closeLink() {
      this.linkOpen = false;
      this.linkError = '';
      this.$refs.linkUrl.value = '';
      this.$refs.editor.focus();
    },
    applyLink() {
      const url = this.$refs.linkUrl.value.trim();
      if (!/^(https?:\/\/|mailto:|\/(?!\/))/i.test(url)) {
        this.linkError = 'Tulis alamat lengkap, diawali https://, mailto: atau /.';
        return;
      }
      this.$refs.editor.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      if (this.saved) sel.addRange(this.saved);
      if (sel.isCollapsed) {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = url;
        document.execCommand('insertHTML', false, a.outerHTML);
      } else {
        document.execCommand('createLink', false, url);
      }
      this.sync();
      this.closeLink();
    },
    sync() {
      this.$refs.hidden.value = this.$refs.editor.innerHTML;
    },
  }));

  // Flash message that disappears on its own.
  window.Alpine.data('toast', () => ({
    visible: true,
    init() {
      setTimeout(() => {
        this.visible = false;
      }, 6000);
    },
    dismiss() {
      this.visible = false;
    },
  }));

  // Asisten Akademik (views/components/chat-widget.ejs): tanya-jawab lewat POST /api/chat.
  // Pesan dibangun dengan createElement + textContent, bukan x-html/x-for: teks jawaban
  // tidak pernah dianggap HTML, dan tautan sumber hanya path internal ("/..." bukan "//...").
  window.Alpine.data('chat', () => ({
    open: false,
    busy: false,
    history: [],
    suggestions: [
      'Kapan jadwal kegiatan akademik terdekat?',
      'Dokumen akademik apa saja yang tersedia?',
      'Bagaimana status akreditasi UNJANI?',
    ],
    init() {
      this.say('bot', 'Halo! Saya asisten virtual Bidang Akademik UNJANI. Tanyakan hal umum tentang kalender akademik, pengumuman, dokumen, kurikulum, atau akreditasi.');
      const row = document.createElement('div');
      row.className = 'flex flex-col items-start gap-2';
      for (const question of this.suggestions) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.textContent = question;
        chip.className = 'min-h-11 rounded-full border border-primary bg-surface px-4 py-2 text-left text-sm font-medium text-primary hover:bg-primary-soft';
        chip.addEventListener('click', () => {
          row.remove();
          this.ask(question);
        });
        row.appendChild(chip);
      }
      this.$refs.log.appendChild(row);
    },
    toggle() {
      this.open = !this.open;
      if (this.open) this.$nextTick(() => this.$refs.input.focus());
    },
    close() {
      if (!this.open) return;
      this.open = false;
      this.$refs.trigger.focus();
    },
    say(role, text, sources = [], isError = false) {
      const bubble = document.createElement('div');
      const tone = role === 'user' ? 'ml-auto bg-primary text-white' : isError ? 'mr-auto bg-danger-soft text-danger' : 'mr-auto border border-line bg-surface text-ink';
      bubble.className = `max-w-[90%] rounded-card px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-line ${tone}`;
      bubble.textContent = text;
      const safe = sources.filter(s => s && typeof s.url === 'string' && /^\/(?!\/)/.test(s.url));
      if (safe.length) {
        const list = document.createElement('ul');
        list.className = 'mt-2 border-t border-line pt-2 text-xs text-muted';
        const heading = document.createElement('li');
        heading.textContent = 'Sumber:';
        list.appendChild(heading);
        for (const source of safe) {
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = source.url;
          link.textContent = source.judul || source.url;
          link.className = 'inline-flex min-h-6 items-center font-medium text-primary underline';
          item.appendChild(link);
          list.appendChild(item);
        }
        bubble.appendChild(list);
      }
      this.$refs.log.appendChild(bubble);
      this.$refs.log.scrollTop = this.$refs.log.scrollHeight;
      return bubble;
    },
    send() {
      const text = this.$refs.input.value.trim();
      if (text) this.ask(text);
    },
    async ask(text) {
      if (this.busy) return;
      this.busy = true;
      this.$refs.input.value = '';
      this.say('user', text);
      const waiting = this.say('bot', 'Sedang mencari jawaban…');
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: this.history.slice(-4) }),
        });
        const data = await res.json().catch(() => ({}));
        waiting.remove();
        if (res.ok && data.answer) {
          this.say('bot', data.answer, data.sources || []);
          this.history.push({ role: 'user', text }, { role: 'bot', text: data.answer });
        } else {
          this.say('bot', data.error || 'Maaf, terjadi kesalahan. Silakan coba lagi nanti atau hubungi Bidang Akademik.', [], true);
        }
      } catch (_err) {
        waiting.remove();
        this.say('bot', 'Koneksi terputus. Periksa jaringan Anda lalu coba lagi.', [], true);
      } finally {
        this.busy = false;
        this.$refs.input.focus();
      }
    },
  }));
});

// Confirmation dialogs: <button data-dialog-open="id"> opens <dialog id="id">.
document.addEventListener('click', event => {
  const opener = event.target.closest('[data-dialog-open]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.dialogOpen);
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
    return;
  }
  const closer = event.target.closest('[data-dialog-close]');
  if (closer) closer.closest('dialog')?.close();
});

// Busy form (SRS FR-AD-09): after a real POST submit, disable the submit button, show a spinner and
// mark the form aria-busy so a slow upload cannot be sent twice. Opt out with data-no-busy.
// Restored on pageshow (back/forward cache) so the button is not left disabled.
document.addEventListener('submit', event => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || event.defaultPrevented) return;
  if (form.method !== 'post' || form.hasAttribute('data-no-busy') || form.closest('dialog')) return;
  if (form.getAttribute('aria-busy') === 'true') {
    event.preventDefault(); // second click while the first request is still running
    return;
  }
  const button = event.submitter || form.querySelector('button[type="submit"]');
  form.setAttribute('aria-busy', 'true');
  if (!button) return;
  const original = button.innerHTML;
  button.dataset.busyOriginal = original;
  // Disable after the form data has been collected (the browser reads the submitter's name/value right after this handler).
  setTimeout(() => {
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${button.dataset.busyLabel || 'Memproses…'}`;
  }, 0);
});
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  document.querySelectorAll('form[aria-busy="true"]').forEach(form => {
    form.removeAttribute('aria-busy');
    form.querySelectorAll('button[data-busy-original]').forEach(button => {
      button.disabled = false;
      button.innerHTML = button.dataset.busyOriginal;
      delete button.dataset.busyOriginal;
    });
  });
});

// Scroll reveal (SRS NFR-U-03): content is visible by default. Only elements that start below the fold
// get .reveal-pending, then .is-visible when they enter the viewport. Nothing happens under
// prefers-reduced-motion or without IntersectionObserver. [data-reveal-group] staggers its direct children.
(function setupReveal() {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = [];
  document.querySelectorAll('[data-reveal-group]').forEach(group => {
    [...group.children].forEach((child, i) => {
      child.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 60}ms`);
      targets.push(child);
    });
  });
  document.querySelectorAll('[data-reveal]').forEach(el => targets.push(el));
  if (!targets.length) return;
  const fold = window.innerHeight;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      observer.unobserve(el);
      // Drop the reveal classes once done so their transition/delay never interferes with hover effects (.lift).
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'transform') return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('reveal-pending', 'is-visible');
        el.style.removeProperty('--reveal-delay');
      });
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => {
    if (el.getBoundingClientRect().top < fold) return; // above the fold: never hidden
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
})();

// Unsaved-changes guard (SRS FR-AD-11): warn before leaving a page whose POST form was edited.
// Submitting a form clears only that form, so adding a quick link while the main form is dirty still warns.
// Opt out with data-no-dirty (login, search). Forms inside dialogs are ignored.
(function setupDirtyGuard() {
  const dirty = new Set();
  const guarded = form => form instanceof HTMLFormElement && form.method === 'post' && !form.hasAttribute('data-no-dirty') && !form.closest('dialog');
  const mark = event => {
    const form = event.target.closest && event.target.closest('form');
    // Drag-and-drop file picks dispatch a synthetic change event, so file inputs are accepted too.
    if ((event.isTrusted || event.target.type === 'file') && form && guarded(form)) dirty.add(form);
  };
  document.addEventListener('input', mark);
  document.addEventListener('change', mark);
  document.addEventListener('submit', event => dirty.delete(event.target));
  window.addEventListener('beforeunload', event => {
    if (!dirty.size) return;
    event.preventDefault();
    event.returnValue = '';
  });
})();

// File input checks in the browser (SRS FR-AD-13): size and type are verified before the upload starts,
// instead of after a slow request. Image picks get a preview (data: URL, because the CSP has no blob:).
// The server still validates everything; this only saves the admin a wasted upload.
document.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
  const field = input.closest('[data-file-field]');
  if (!field) return;
  const error = field.querySelector('[data-file-error]');
  const preview = field.querySelector('[data-file-preview]');
  const accepts = (input.accept || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
  const maxBytes = Number(input.dataset.maxMb || 0) * 1024 * 1024;
  const matchesType = file => !accepts.length || accepts.some(a => (a.startsWith('.') ? file.name.toLowerCase().endsWith(a) : file.type === a));
  let message = '';
  for (const file of input.files) {
    if (!matchesType(file)) message = `"${file.name}" bukan jenis file yang diterima.`;
    else if (maxBytes && file.size > maxBytes) message = `"${file.name}" berukuran ${(file.size / 1048576).toFixed(1).replace('.', ',')} MB, melebihi batas ${input.dataset.maxMb} MB.`;
    if (message) break;
  }
  if (error) {
    error.textContent = message;
    error.hidden = !message;
  }
  if (message) input.value = '';
  if (preview) {
    preview.hidden = true;
    const file = !message && input.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        preview.src = reader.result;
        preview.hidden = false;
      };
      reader.readAsDataURL(file);
    }
  }
});

// Highlight the row(s) saved just before this redirect (?success=). Server time (body[data-now]) is used,
// not the browser clock, so a wrong device clock cannot hide or fake the highlight.
(function flashSavedRows() {
  if (!/[?&]success=/.test(window.location.search)) return;
  const now = Number(document.body.dataset.now);
  if (!now) return;
  document.querySelectorAll('tr[data-updated]').forEach(row => {
    const updated = Date.parse(row.dataset.updated);
    if (updated && now - updated < 90000) row.classList.add('row-flash');
  });
})();

// Drag-and-drop onto a file field (SRS FR-AD-13): fills the field's <input type="file"> and reuses its change checks.
(function setupDropzone() {
  const fieldOf = event => event.target.closest && event.target.closest('[data-file-field]');
  const hasFiles = event => event.dataTransfer && [...event.dataTransfer.types].includes('Files');
  document.addEventListener('dragover', event => {
    const field = fieldOf(event);
    if (!field || !hasFiles(event)) return;
    event.preventDefault(); // allows the drop
    field.classList.add('dropzone-active');
  });
  document.addEventListener('dragleave', event => {
    const field = fieldOf(event);
    if (field && !field.contains(event.relatedTarget)) field.classList.remove('dropzone-active');
  });
  document.addEventListener('drop', event => {
    const field = fieldOf(event);
    if (!field || !hasFiles(event)) return;
    event.preventDefault();
    field.classList.remove('dropzone-active');
    const input = field.querySelector('input[type="file"]');
    if (!input) return;
    const files = [...event.dataTransfer.files];
    const transfer = new DataTransfer();
    (input.multiple ? files : files.slice(0, 1)).forEach(file => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
})();
