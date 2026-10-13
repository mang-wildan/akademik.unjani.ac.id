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
    if (event.isTrusted && form && guarded(form)) dirty.add(form);
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
