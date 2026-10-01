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
    },
    close() {
      this.open = false;
    },
    closeAndFocus() {
      if (!this.open) return;
      this.open = false;
      if (this.$refs.trigger) this.$refs.trigger.focus();
    },
  }));

  // Tabs with arrow-key navigation (WAI-ARIA tabs pattern).
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
