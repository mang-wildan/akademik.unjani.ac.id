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

// Lightweight native confirm for low-stakes row deletes where a per-row
// <dialog> would be excessive (e.g. one calendar event among many). Degrades
// to a plain submit without JS, same as every other mutation in the admin.
document.addEventListener('submit', event => {
  const message = event.target.dataset && event.target.dataset.confirm;
  if (message && !window.confirm(message)) event.preventDefault();
});
