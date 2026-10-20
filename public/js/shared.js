/* Komponen bersama: dimuat sebelum app.js/admin.js dan Alpine CSP. */
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

  // Minimal rich-text editor: contenteditable + toolbar, no dependency.
  // Server-side sanitizeHtml() is the real guard (NFR-S-06); this is only
  // for the admin's writing experience.
  window.Alpine.data('richtext', () => ({
    // Alpine's CSP build blocks property assignment (e.g. `.innerHTML = …`)
    // from template expressions like x-init; doing it here, inside a real
    // method, is unrestricted and runs once when the component mounts.
    init() {
      this.$refs.editor.innerHTML = this.$refs.hidden.value;
      // The v2 textarea remains usable until the enhanced editor is ready.
      if (this.$refs.hidden.tagName === 'TEXTAREA') this.$refs.hidden.hidden = true;
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
      this.$refs.hidden.dispatchEvent(new Event('input', { bubbles: true }));
    },
  }));

  // Flash message that disappears on its own.
  window.Alpine.data('toast', () => ({
    visible: true,
    timer: null,
    remaining: 6000,
    started: 0,
    init() {
      this.remaining = Number(this.$el?.dataset.toastDuration || 6000);
      this.start();
    },
    start() {
      this.started = Date.now();
      this.timer = setTimeout(() => {
        this.visible = false;
        this.timer = null;
      }, this.remaining);
    },
    pause() {
      if (this.timer === null) return;
      clearTimeout(this.timer);
      this.timer = null;
      this.remaining = Math.max(0, this.remaining - (Date.now() - this.started));
    },
    resume() {
      this.$nextTick(() => {
        if (this.visible && this.timer === null && !this.$el.matches(':hover, :focus-within')) this.start();
      });
    },
    dismiss() {
      this.destroy();
      this.visible = false;
    },
    destroy() {
      clearTimeout(this.timer);
      this.timer = null;
    },
  }));

});
