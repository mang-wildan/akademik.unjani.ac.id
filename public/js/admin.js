/* Dimuat setelah shared.js dan sebelum Alpine CSP oleh layouts/admin-v2. */
document.addEventListener('alpine:init', () => {
  window.Alpine.data('moduleSearch', () => ({
    open: false,
    count: 0,
    get options() { return [...this.$root.querySelectorAll('[data-module-option]')]; },
    get noResults() { return this.count === 0; },
    search() {
      const query = this.$refs.input.value.trim().toLocaleLowerCase('id');
      this.count = 0;
      this.options.forEach(option => {
        option.hidden = !option.dataset.label.toLocaleLowerCase('id').includes(query);
        if (!option.hidden) this.count++;
      });
      this.open = true;
    },
    focus() {
      this.open = true;
      this.$nextTick(() => this.$refs.input.focus());
    },
    toggle() { if (this.open) this.close(); else this.focus(); },
    close(event) {
      this.open = false;
      if (event?.type === 'keydown' && this.$refs.trigger.offsetParent !== null) this.$refs.trigger.focus();
    },
    focusout(event) { if (!this.$root.contains(event.relatedTarget)) this.close(); },
    go() {
      const first = this.options.find(option => !option.hidden);
      if (first) location.assign(first.href);
    },
    shortcut(event) {
      // Ctrl/Cmd+K berlaku juga saat mengetik di kolom (seperti palet perintah umumnya).
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        if (document.querySelector('dialog[open]')) return;
        event.preventDefault();
        this.focus();
        return;
      }
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if (event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      this.focus();
    },
  }));
  window.Alpine.data('errorSummary', () => ({
    init() {
      this.$nextTick(() => this.$el.focus());
    },
  }));
  window.Alpine.data('confirmDialog', () => ({
    init() {
      this.$refs.dialog.close();
    },
    show() {
      this.$refs.dialog.showModal();
    },
    backdrop(event) {
      if (event.target === this.$refs.dialog) this.$refs.dialog.close();
    },
  }));
  window.Alpine.data('bulkBar', () => ({
    selectedCount: 0,
    allFiltered: false,
    error: '',
    get total() { return Number(this.$refs.bulkForm.dataset.total); },
    get count() { return this.allFiltered ? this.total : this.selectedCount; },
    get active() { return this.count > 0; },
    get scope() { return this.allFiltered ? 'filter' : 'selected'; },
    get selectionLabel() { return `${this.count} ${this.$refs.bulkForm.dataset.noun} dipilih`; },
    get deleteTitle() { return `Hapus ${this.count} ${this.$refs.bulkForm.dataset.noun}?`; },
    get selectAllLabel() { return `Pilih semua ${this.total} hasil filter`; },
    get canSelectAll() { return this.active && !this.allFiltered && this.total > this.selectedCount; },
    get tooManyResults() { return this.total > 500; },
    get cannotSubmit() { return !this.active || this.count > 500; },
    selection(event) {
      this.selectedCount = event.detail.count;
      this.allFiltered = false;
      this.error = '';
    },
    selectAll() {
      if (this.tooManyResults) return;
      this.$dispatch('bulk-select-all');
      this.allFiltered = true;
    },
    clearSelection() {
      this.allFiltered = false;
      this.selectedCount = 0;
      this.error = '';
      this.$dispatch('bulk-clear');
    },
    openDelete() {
      if (!this.cannotSubmit) this.$refs.deleteDialog.showModal();
    },
    closeDelete() { this.$refs.deleteDialog.close(); },
    deleteBackdrop(event) {
      if (event.target === this.$refs.deleteDialog) this.closeDelete();
    },
    submit(event) {
      if (this.cannotSubmit) {
        event.preventDefault();
        this.error = this.count > 500 ? 'Maksimal 500 data per aksi. Kurangi pilihan terlebih dahulu.' : 'Pilih minimal satu data.';
      } else if (event.submitter?.value === 'delete' && (event.submitter !== this.$refs.deleteConfirm || !this.$refs.deleteDialog.open)) {
        event.preventDefault();
        this.openDelete();
      }
    },
  }));
  // Tabel data (views/admin/_ui/data-table.ejs). Kotak centang baris ada di DOM
  // dan terikat ke form bulk lewat atribut form=, jadi tetap terkirim tanpa JS;
  // komponen ini hanya menambah centang semua, Shift+klik, dan mode pilih HP.
  window.Alpine.data('dataTable', () => ({
    count: 0,
    selecting: false,
    lastIndex: null,
    init() {
      this.sync();
    },
    get boxes() {
      return [...this.$root.querySelectorAll('input[data-row-check]')];
    },
    get selectToggleLabel() {
      return this.selecting ? 'Selesai' : 'Pilih';
    },
    // Delegasi di <tbody>: event click datang setelah browser mengubah checked.
    rowClick(event) {
      const box = event.target.closest && event.target.closest('input[data-row-check]');
      if (!box) return;
      const boxes = this.boxes;
      const index = boxes.indexOf(box);
      if (event.shiftKey && this.lastIndex !== null) {
        const [from, to] = [Math.min(this.lastIndex, index), Math.max(this.lastIndex, index)];
        boxes.slice(from, to + 1).forEach(b => {
          b.checked = box.checked;
        });
      }
      this.lastIndex = index;
      this.sync();
    },
    toggleAll(event) {
      this.boxes.forEach(b => {
        b.checked = event.target.checked;
      });
      this.lastIndex = null;
      this.sync();
    },
    clear() {
      this.boxes.forEach(b => {
        b.checked = false;
      });
      this.lastIndex = null;
      this.sync();
    },
    bulkClear(event) {
      const list = this.$root.closest('[data-bulk-list]');
      if (!list || event.target.closest?.('[data-bulk-list]') !== list) return;
      this.selecting = false;
      this.clear();
      this.$nextTick(() => {
        const toggle = this.$refs.selectToggle;
        if (toggle?.getClientRects().length) toggle.focus();
        else this.$refs.all?.focus();
      });
    },
    bulkSelectAll(event) {
      const list = this.$root.closest('[data-bulk-list]');
      if (list && event.target.closest?.('[data-bulk-list]') === list) this.toggleAll({ target: { checked: true } });
    },
    toggleSelecting() {
      this.selecting = !this.selecting;
      if (!this.selecting) this.clear();
    },
    sync() {
      const boxes = this.boxes;
      const ids = boxes.filter(b => b.checked).map(b => b.value);
      this.count = ids.length;
      if (ids.length) this.selecting = true;
      const all = this.$refs.all;
      if (all) {
        all.checked = ids.length > 0 && ids.length === boxes.length;
        all.indeterminate = ids.length > 0 && ids.length < boxes.length;
      }
      this.$dispatch('table-selection', { ids, count: ids.length, total: boxes.length });
    },
  }));
  window.Alpine.data('filterBar', () => ({
    open: false,
    toggle() {
      this.open = !this.open;
    },
    get collapsed() {
      return !this.open;
    },
  }));
  // Panel samping untuk form pendek (views/admin/_ui/slide-over.ejs, ARCHITECTURE §2.5).
  // Tautan [data-slide-over] tetap href biasa: tanpa JS halaman form penuh terbuka.
  const ACCEPT = 'application/json, text/html;q=0.9'; // 401 dari requireAuth datang sebagai JSON
  const withPartial = href => {
    const url = new URL(href, location.href);
    url.searchParams.set('partial', '1');
    return url.toString();
  };
  const failure = message => Object.assign(new Error(message), { userMessage: message });
  const messageOf = error => error.userMessage || 'Koneksi terputus. Periksa jaringan lalu coba lagi.';
  const ID_PATTERN = /^[\w-]+$/;

  window.Alpine.data('slideOver', () => {
    let trigger = null; // elemen DOM di luar data reaktif Alpine
    return {
    title: '',
    loading: false,
    loadFailed: false,
    busy: false,
    error: '',
    dirty: false,
    confirming: false,
    href: '',
    pushed: false, // panel punya entri riwayat sendiri → tutup lewat history.back()
    after: null, // tindak lanjut setelah panel tertutup (muat ulang daftar + toast)
    ticket: 0, // respons lama yang datang terlambat diabaikan
    expectClose: false, // event close berikutnya berasal dari finishClose sendiri
    triggerHref: '',
    init() {
      const href = this.hrefFromLocation();
      if (href) this.open(href, false);
    },
    // '/admin/kategori/:id/edit' → ['edit', id]; '/admin/kategori/new' → ['new', '1']
    paramFor(pathname) {
      pathname = new URL(pathname, location.href).pathname;
      const { editUrl, newUrl } = this.$root.dataset;
      if (newUrl && pathname === newUrl) return ['new', '1'];
      if (!editUrl) return null;
      const [before, after] = editUrl.split(':id');
      if (!pathname.startsWith(before) || !pathname.endsWith(after)) return null;
      const id = pathname.slice(before.length, pathname.length - after.length);
      return ID_PATTERN.test(id) ? ['edit', id] : null;
    },
    hrefFromLocation() {
      const params = new URLSearchParams(location.search);
      const { editUrl, newUrl } = this.$root.dataset;
      const id = params.get('edit');
      if (id && editUrl && ID_PATTERN.test(id)) return editUrl.replace(':id', id);
      if (params.get('new') === '1' && newUrl) {
        const url = new URL(newUrl, location.href);
        url.search = new URL(this.listUrl(), location.href).search;
        return url.pathname + url.search;
      }
      return '';
    },
    // URL daftar saat ini (filter tetap) dengan/atau tanpa ?edit= / ?new=.
    listUrl(param) {
      const url = new URL(location.href);
      ['edit', 'new', 'success', 'error'].forEach(key => url.searchParams.delete(key));
      if (param) url.searchParams.set(param[0], param[1]);
      return url.pathname + url.search;
    },
    intercept(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest && event.target.closest('a[data-slide-over]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !this.paramFor(url.pathname)) return;
      event.preventDefault();
      this.triggerHref = link.getAttribute('href');
      trigger = link;
      this.open(url.pathname + url.search, true);
    },
    async open(href, push) {
      if (this.$refs.panel.open && this.dirty) {
        this.confirming = true;
        return;
      }
      const ticket = ++this.ticket;
      Object.assign(this, { href, title: 'Memuat…', loading: true, loadFailed: false, error: '', dirty: false, confirming: false });
      this.$refs.body.replaceChildren();
      if (push) {
        history.pushState({ slideOver: href }, '', this.listUrl(this.paramFor(href)));
        this.pushed = true;
      }
      if (!this.$refs.panel.open) this.$refs.panel.showModal();
      try {
        const res = await fetch(withPartial(href), { headers: { Accept: ACCEPT }, credentials: 'same-origin' });
        if (ticket !== this.ticket) return;
        if (!res.ok) throw failure(await this.failureMessage(res, 'Form gagal dimuat.'));
        this.render(await res.text());
      } catch (error) {
        if (ticket !== this.ticket) return;
        Object.assign(this, { error: messageOf(error), loadFailed: true, title: 'Form gagal dimuat' });
      } finally {
        if (ticket === this.ticket) this.loading = false;
      }
    },
    async failureMessage(res, fallback) {
      if (res.status === 404) return 'Data tidak ditemukan. Mungkin sudah dihapus.';
      if (res.status === 401) return 'Sesi Anda berakhir. Masuk kembali lalu ulangi.';
      if (res.status === 403) return 'Anda tidak punya akses ke data ini.';
      if (res.status >= 500) return 'Server sedang bermasalah. Coba lagi beberapa saat lagi.';
      if ((res.headers.get('content-type') || '').includes('application/json')) {
        const body = await res.json().catch(() => ({}));
        if (body.error || body.message) return body.error || body.message;
      }
      return `${fallback} (kode ${res.status})`;
    },
    // Komponen Alpine di dalam HTML baru diinisialisasi oleh MutationObserver Alpine.
    render(html) {
      const body = this.$refs.body;
      body.innerHTML = html;
      const titled = body.querySelector('[data-panel-title]');
      const heading = body.querySelector('h1, h2');
      this.title = (titled && titled.dataset.panelTitle) || (heading && heading.textContent.trim()) || 'Form';
      this.$nextTick(() => this.focusFirst());
    },
    focusFirst() {
      const body = this.$refs.body;
      if (body.querySelector('[x-data="errorSummary"]')) return; // ringkasan error memfokuskan dirinya sendiri
      const field = body.querySelector('[autofocus], input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
      if (field) field.focus();
    },
    async submit(event) {
      const form = event.target;
      if (form.nodeName !== 'FORM' || form.method !== 'post' || form.hasAttribute('data-no-slide')) return;
      event.preventDefault(); // juga melewati penanda sibuk global (ia memeriksa defaultPrevented)
      if (this.busy) return;
      const submitter = event.submitter || null;
      const data = submitter ? new FormData(form, submitter) : new FormData(form);
      // Sama seperti submit biasa: hanya form multipart dikirim sebagai multipart.
      const body = form.enctype === 'multipart/form-data' ? data : new URLSearchParams(data);
      this.busy = true;
      this.error = '';
      form.setAttribute('aria-busy', 'true');
      if (!form.hasAttribute('data-no-busy')) showBusy(submitter, form);
      try {
        const res = await fetch(withPartial(form.action), { method: 'POST', body, headers: { Accept: ACCEPT }, credentials: 'same-origin' });
        const type = res.headers.get('content-type') || '';
        if (res.ok && type.includes('application/json')) {
          const result = await res.json();
          if (result.ok) return this.saved(result.message);
          throw failure(result.error || result.message || 'Gagal menyimpan.');
        }
        // Controller yang belum mengirim JSON: redirect ke daftar dengan ?success= berarti tersimpan.
        if (res.ok && res.redirected) {
          const params = new URL(res.url).searchParams;
          if (params.get('success')) return this.saved(params.get('success'));
          throw failure(params.get('error') || 'Perubahan mungkin belum tersimpan. Muat ulang halaman untuk memastikan.');
        }
        if ((res.ok || res.status === 422) && type.includes('text/html')) {
          this.render(await res.text()); // form dengan pesan error
          this.dirty = true;
          return;
        }
        throw failure(await this.failureMessage(res, 'Gagal menyimpan.'));
      } catch (error) {
        this.error = messageOf(error);
      } finally {
        this.busy = false;
        form.removeAttribute('aria-busy');
        if (!form.hasAttribute('data-no-busy')) clearBusy(submitter);
      }
    },
    saved(message) {
      this.dirty = false;
      this.close({ refresh: true, message: message || 'Perubahan tersimpan.' });
    },
    close(after = {}) {
      this.after = after;
      if (this.pushed) {
        this.pushed = false;
        history.back(); // popstate → finishClose
      } else {
        history.replaceState(null, '', this.listUrl());
        this.finishClose();
      }
    },
    finishClose() {
      this.ticket += 1;
      Object.assign(this, { loading: false, loadFailed: false, busy: false, error: '', dirty: false, confirming: false, href: '' });
      if (this.$refs.panel.open) {
        this.expectClose = true;
        this.$refs.panel.close();
      }
      this.$refs.body.replaceChildren();
      const after = this.after || {};
      this.after = null;
      if (after.refresh) this.refreshList(after.message);
      else this.restoreFocus();
    },
    // Kembali lewat history bisa memfokuskan target #fragmen (mis. #konten setelah skip-link)
    // sesudah dialog mengembalikan fokus; pastikan fokus tetap di pemicu panel.
    restoreFocus() {
      const el = trigger;
      setTimeout(() => {
        if (el && el.isConnected && document.activeElement !== el) el.focus();
      }, 0);
    },
    popstate(event) {
      const fromState = event.state && event.state.slideOver;
      if (this.$refs.panel.open && this.dirty && !this.after) {
        // Back tidak bisa dibatalkan: pulihkan entri panel lalu tanyakan dulu.
        history.pushState({ slideOver: this.href }, '', this.listUrl(this.paramFor(this.href)));
        this.pushed = true;
        this.confirming = true;
        return;
      }
      const href = fromState || this.hrefFromLocation();
      if (href) {
        this.pushed = Boolean(fromState);
        this.open(href, false);
        return;
      }
      if (this.$refs.panel.open || this.after) this.finishClose();
    },
    requestClose() {
      if (this.dirty) {
        this.confirming = true;
        this.$nextTick(() => this.$refs.discard && this.$refs.discard.focus());
        return;
      }
      this.close();
    },
    // Escape ditangani di keydown: Chrome bisa mengirim event cancel yang tidak bisa dibatalkan
    // (tanpa aktivasi pengguna sejak dialog dibuka), sehingga preventDefault di cancel tidak cukup.
    escape(event) {
      event.preventDefault();
      this.requestClose();
    },
    cancel(event) {
      event.preventDefault();
      this.requestClose();
    },
    // Jaring pengaman bila browser tetap menutup dialog tanpa lewat komponen ini.
    nativeClose() {
      if (this.expectClose) {
        this.expectClose = false;
        return;
      }
      if (this.dirty) {
        this.$refs.panel.showModal();
        this.confirming = true;
        return;
      }
      this.close();
    },
    backdrop(event) {
      if (event.target === this.$refs.panel) this.requestClose();
    },
    bodyClick(event) {
      const closer = event.target.closest && event.target.closest('[data-slide-close]');
      if (!closer) return;
      event.preventDefault();
      this.requestClose();
    },
    discard() {
      this.dirty = false;
      this.confirming = false;
      this.close();
    },
    keepEditing() {
      this.confirming = false;
      this.$nextTick(() => this.focusFirst());
    },
    markDirty(event) {
      // Closing a dialog blurs inputs and may emit a final change after saving.
      if (this.$refs.panel.open && event.target.closest && event.target.closest('form')) this.dirty = true;
    },
    beforeUnload(event) {
      if (!this.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    },
    async refreshList(message) {
      try {
        const region = document.querySelector('[data-list-region]');
        if (!region) throw failure('');
        const res = await fetch(withPartial(location.href), { headers: { Accept: 'text/html' }, credentials: 'same-origin' });
        if (!res.ok) throw failure('');
        const fresh = new DOMParser().parseFromString(await res.text(), 'text/html').querySelector('[data-list-region]');
        if (!fresh) throw failure('');
        region.replaceWith(document.importNode(fresh, true));
        const trigger = [...document.querySelectorAll('a[data-slide-over]')].find(a => a.getAttribute('href') === this.triggerHref);
        if (trigger) trigger.focus();
        this.toast(message);
      } catch (_error) {
        // Muat ulang penuh tetap menampilkan pesan lewat toast server.
        const url = new URL(location.href);
        url.searchParams.set('success', message);
        location.assign(url.toString());
      }
    },
    toast(message) {
      document.querySelectorAll('[data-toast]').forEach(node => node.remove());
      const node = this.$refs.toastTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector('[data-toast-message]').textContent = message;
      document.body.append(node);
    },
  };
  });

  // Form halaman penuh: peringatan sebelum meninggalkan halaman dengan perubahan.
  // <form x-data="dirtyGuard" x-on:input="mark" x-on:change="mark" x-on:submit="submitted" x-on:beforeunload.window="beforeUnload">
  window.Alpine.data('dirtyGuard', () => ({
    dirty: false,
    mark() {
      this.dirty = true;
    },
    submitted() {
      this.dirty = false;
    },
    beforeUnload(event) {
      if (!this.dirty) return;
      event.preventDefault();
      event.returnValue = '';
    },
  }));

  // Pintasan keyboard (DESIGN §8). N = tombol [data-shortcut="new"]; Ctrl/Cmd+S = form[data-save-form]
  // di panel yang terbuka, atau di halaman bila tidak ada panel.
  window.Alpine.data('shortcuts', () => ({
    find(selector) {
      return document.querySelector(selector);
    },
    keydown(event) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && !event.altKey && key === 's') {
        const form = event.target.closest?.('form[data-save-form]') || this.find('dialog[open] form[data-save-form]') || (!this.find('dialog[open]') && this.find('form[data-save-form]'));
        if (!form) return;
        event.preventDefault();
        form.requestSubmit(form.querySelector('button[type="submit"]:not([formmethod="dialog"])') || undefined);
        return;
      }
      if (key !== 'n' || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (event.target.closest && event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      if (this.find('dialog[open]')) return;
      const trigger = this.find('[data-shortcut="new"]');
      if (!trigger) return;
      event.preventDefault();
      trigger.click();
    },
  }));

  // Preferensi tampilan dipakai /admin dan /profile (keduanya layout admin-v2). Ditulis per path,
  // bukan Path=/: cookie lama ber-Path=/admin akan terkirim lebih dulu dan menang di /admin.
  const savePref = (name, value) => ['/admin', '/profile'].forEach(path => {
    document.cookie = `${name}=${value}; Path=${path}; Max-Age=31536000; SameSite=Lax`;
  });

  window.Alpine.data('adminShell', () => ({
    theme: 'system',
    sidebar: 'open',
    init() {
      this.theme = document.documentElement.dataset.theme || 'system';
      this.sidebar = document.documentElement.dataset.sidebar || 'open';
    },
    // Alpine CSP hanya bisa membaca nama properti, jadi status untuk
    // aria-pressed/aria-expanded/aria-label disediakan sebagai getter.
    get themeLight() {
      return this.theme === 'light';
    },
    get themeDark() {
      return this.theme === 'dark';
    },
    get themeSystem() {
      return this.theme === 'system';
    },
    get sidebarExpanded() {
      return this.sidebar !== 'collapsed';
    },
    get sidebarToggleLabel() {
      return this.sidebarExpanded ? 'Ciutkan sidebar' : 'Lebarkan sidebar';
    },
    toggleSidebar() {
      this.sidebar = this.sidebar === 'collapsed' ? 'open' : 'collapsed';
      document.documentElement.dataset.sidebar = this.sidebar;
      savePref('admin_sidebar', this.sidebar);
    },
    setTheme(event) {
      const theme = event.currentTarget.dataset.theme;
      if (!['light', 'dark', 'system'].includes(theme)) return;
      this.theme = theme;
      document.documentElement.dataset.theme = theme;
      savePref('admin_theme', theme);
    },
    // Dialog native menangani Escape, batas fokus, dan pengembalian fokus.
    openDrawer() {
      this.$refs.drawer.showModal();
    },
    closeDrawer() {
      this.$refs.drawer.close();
    },
    // Klik di luar panel jatuh ke elemen <dialog> itu sendiri (backdrop).
    drawerBackdrop(event) {
      if (event.target === this.$refs.drawer) this.closeDrawer();
    },
  }));
});

// Tentukan label tombol saat proses (ADM-11).
function busyLabel(form, button) {
  const custom = button?.dataset?.busyLabel || form.getAttribute?.('data-busy-label');
  if (custom) return custom;
  const action = (form.getAttribute?.('action') || (typeof form.action === 'string' ? form.action : '')).split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  const intent = button?.name === 'intent' || button?.name === 'action' ? button.value : '';
  if (intent === 'delete' || form.dataset?.intent === 'delete' || /\/delete$/.test(action)) return 'Menghapus…';
  if ((form.hasAttribute('data-pdf-upload') || /^\/admin\/graduation-books(\/|$)/i.test(action)) && form.enctype === 'multipart/form-data') {
    const fileInput = form.querySelector('input[type="file"][name="file"]');
    if (fileInput && fileInput.files && fileInput.files.length > 0) return 'Mengunggah dan mengompres PDF…';
  }
  if (/\/(bulk|import|reset-password|pin)$/.test(action)) return 'Memproses…';
  if (form.hasAttribute('data-save-form') || /^\/admin\/[^/]+(\/new|$)/i.test(action) || /^\/admin\/[^/]+\/[a-f0-9]{24}$/i.test(action)) {
    return 'Menyimpan…';
  }
  return 'Memproses…';
}

function showBusy(button, form) {
  if (!button) return;
  button.dataset.busyOriginal = button.innerHTML;
  button.setAttribute('aria-busy', 'true');
  if (!form) form = button.closest('form');
  button.disabled = true;
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + busyLabel(form, button);
}

function clearBusy(button) {
  if (!button) return;
  button.disabled = false;
  button.removeAttribute('aria-busy');
  if (button.dataset.busyOriginal !== undefined) {
    button.innerHTML = button.dataset.busyOriginal;
    delete button.dataset.busyOriginal;
  }
}

// Tunda disable sampai browser mengumpulkan name/value tombol submit.
document.addEventListener('submit', event => {
  const form = event.target;
  if (event.defaultPrevented || form.method !== 'post' || event.submitter?.formMethod === 'dialog' || form.hasAttribute('data-no-busy')) return;
  if (form.getAttribute('aria-busy') === 'true') {
    event.preventDefault();
    return;
  }
  const button = event.submitter || form.querySelector('button[type="submit"]');
  form.setAttribute('aria-busy', 'true');
  if (!button) return;
  button.setAttribute('aria-busy', 'true');
  setTimeout(() => showBusy(button, form), 0);
});
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  document.querySelectorAll('form[aria-busy="true"]').forEach(form => {
    form.removeAttribute('aria-busy');
    [...(form.elements || form.querySelectorAll('button[data-busy-original]'))].forEach(button => {
      if (button.dataset?.busyOriginal !== undefined) clearBusy(button);
    });
  });
});
