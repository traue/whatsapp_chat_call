// WhatsOpener — vanilla JS app.
// Depends on: scripts/i18n.js (WO_I18N, WO_COUNTRIES, WO_detectCountry,
//             WO_relTime, WO_buildWaLink, WO_formatPhoneE164)
//             scripts/qr.js  (WO_qrMatrix)

(function () {
  'use strict';

  const VERSION = '4.1.0';

  const STORAGE = {
    history: 'wo:history:v1',
    theme:   'wo:theme:v1',
    lang:    'wo:lang:v1',
  };

  // ── State ─────────────────────────────────────────────
  const state = {
    lang:    readLang(),
    theme:   readTheme(),
    country: readCountry(),
    number:  '',
    message: '',
    showQR:  false,
    history: readHistory(),
    search:  '',
    renamingId: null,
  };

  function readLang() {
    try {
      const v = localStorage.getItem(STORAGE.lang);
      if (v === 'pt' || v === 'en') return v;
    } catch (_) {}
    return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  }
  function readTheme() {
    try {
      const v = localStorage.getItem(STORAGE.theme);
      if (v === 'light' || v === 'dark') return v;
    } catch (_) {}
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function readCountry() {
    // Pick the most recent history entry's country if available; otherwise auto-detect.
    try {
      const raw = localStorage.getItem(STORAGE.history);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr) && arr.length && arr[0].country) return arr[0].country;
    } catch (_) {}
    return window.WO_detectCountry();
  }
  function readHistory() {
    try {
      const raw = localStorage.getItem(STORAGE.history);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }
  function persistHistory() {
    try { localStorage.setItem(STORAGE.history, JSON.stringify(state.history)); } catch (_) {}
  }

  // ── DOM refs ──────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const els = {
    body:           document.body,
    countrySelect:  $('country'),
    countryFlag:    $('country-flag'),
    countryDial:    $('country-dial'),
    phone:          $('phone'),
    message:        $('message'),
    openBtn:        $('open-btn'),
    copyBtn:        $('copy-btn'),
    copyLabel:      $('copy-label'),
    qrBtn:          $('qr-btn'),
    qrPanel:        $('qr-panel'),
    qrCode:         $('qr-code'),
    qrLink:         $('qr-link'),
    historyCount:   $('history-count'),
    historySearch:  $('history-search'),
    historyEmpty:   $('history-empty'),
    historyList:    $('history-list'),
    clearAll:       $('clear-all'),
    themeToggle:    document.querySelector('.theme-toggle'),
    langButtons:    document.querySelectorAll('.seg-toggle button[data-lang]'),
  };

  // ── Helpers ───────────────────────────────────────────
  const t = () => window.WO_I18N[state.lang] || window.WO_I18N.pt;
  const dialOf = (code) => {
    const c = window.WO_COUNTRIES.find(x => x.code === code);
    return c ? c.dial : '55';
  };
  const countryOf = (code) =>
    window.WO_COUNTRIES.find(x => x.code === code) || window.WO_COUNTRIES[0];
  const digitsOf = (raw) => String(raw || '').replace(/\D/g, '');
  const isValid  = () => digitsOf(state.number).length >= 6;
  const currentLink = () => window.WO_buildWaLink(dialOf(state.country), state.number, state.message);

  // Escape user-controlled text for innerHTML insertion.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── i18n ──────────────────────────────────────────────
  function applyI18n() {
    const dict = t();
    document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : 'en';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const spec = el.getAttribute('data-i18n-attr'); // "attr:key"
      const [attr, key] = spec.split(':');
      if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
    });

    // Active state for language toggle
    els.langButtons.forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === state.lang);
    });

    // Theme toggle title
    els.themeToggle.setAttribute('title', state.theme === 'dark' ? dict.light : dict.dark);
    els.themeToggle.setAttribute('aria-label', state.theme === 'dark' ? dict.light : dict.dark);

    // Re-render dynamic bits whose copy depends on language
    renderCountryOptions();
    renderHistory();
    if (state.showQR) renderQR();
  }

  // ── Theme ─────────────────────────────────────────────
  function applyTheme() {
    els.body.setAttribute('data-theme', state.theme);
    try { localStorage.setItem(STORAGE.theme, state.theme); } catch (_) {}
  }

  // ── Country select ────────────────────────────────────
  function renderCountryOptions() {
    const dict = t();
    const sel = els.countrySelect;
    // Rebuild only if list isn't current language. We track via a data attr.
    if (sel.dataset.lang === state.lang) {
      sel.value = state.country;
      updateCountryChip();
      return;
    }
    sel.innerHTML = '';
    window.WO_COUNTRIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.flag + ' ' + c.name[state.lang] + ' (+' + c.dial + ')';
      sel.appendChild(opt);
    });
    sel.dataset.lang = state.lang;
    sel.value = state.country;
    updateCountryChip();
  }
  function updateCountryChip() {
    const c = countryOf(state.country);
    els.countryFlag.textContent = c.flag;
    els.countryDial.textContent = '+' + c.dial;
  }

  // ── Validity / link / QR ──────────────────────────────
  function updateValidity() {
    const ok = isValid();
    els.openBtn.disabled = !ok;
    els.copyBtn.disabled = !ok;
    els.qrBtn.disabled = !ok;
    if (!ok && state.showQR) {
      state.showQR = false;
      els.qrBtn.classList.remove('is-active');
      els.qrBtn.setAttribute('aria-pressed', 'false');
      els.qrPanel.hidden = true;
    }
    if (state.showQR) renderQR();
  }
  function renderQR() {
    const link = currentLink();
    if (!link) return;
    els.qrLink.textContent = link;
    let matrix;
    try { matrix = window.WO_qrMatrix(link); } catch (_) { return; }
    if (!matrix) return;
    const size = 140;
    const cell = size / matrix.size;
    let rects = '';
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) {
        if (matrix.data[y][x]) {
          rects += '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + (cell + 0.5) + '" height="' + (cell + 0.5) + '"/>';
        }
      }
    }
    els.qrCode.innerHTML =
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="display:block">' +
        '<g fill="#0e1a14">' + rects + '</g>' +
      '</svg>';
  }

  // ── History ───────────────────────────────────────────
  function upsertHistoryEntry({ dial, number, country, message }) {
    const key = dial + ':' + number;
    const idx = state.history.findIndex(p => (p.dial + ':' + p.number) === key);
    let merged;
    if (idx >= 0) {
      const existing = state.history[idx];
      merged = Object.assign({}, existing, {
        lastOpened: Date.now(),
        opens: (existing.opens || 1) + 1,
        message: message != null ? message : existing.message,
      });
      state.history.splice(idx, 1);
    } else {
      merged = {
        id: key, dial: dial, number: number, country: country,
        alias: '', favorite: false, message: message || '',
        lastOpened: Date.now(), opens: 1,
      };
    }
    state.history.unshift(merged);
    if (state.history.length > 200) state.history.length = 200;
    persistHistory();
    renderHistory();
  }

  function updateHistory(id, patch) {
    const idx = state.history.findIndex(p => p.id === id);
    if (idx < 0) return;
    state.history[idx] = Object.assign({}, state.history[idx], patch);
    persistHistory();
    renderHistory();
  }
  function removeHistory(id) {
    state.history = state.history.filter(p => p.id !== id);
    persistHistory();
    renderHistory();
  }
  function clearAllHistory() {
    state.history = [];
    persistHistory();
    renderHistory();
  }

  function filteredHistory() {
    const s = state.search.trim().toLowerCase();
    let arr = state.history;
    if (s) {
      arr = arr.filter(it =>
        (it.alias || '').toLowerCase().includes(s) ||
        it.number.includes(s) ||
        ('+' + it.dial + it.number).includes(s)
      );
    }
    return arr.slice().sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.lastOpened - a.lastOpened;
    });
  }

  function prettyNumber(it) {
    const c = window.WO_COUNTRIES.find(x => x.code === it.country);
    return (c ? c.flag + ' ' : '') + '+' + it.dial + ' ' + it.number;
  }

  function renderHistory() {
    const dict = t();
    els.historyCount.textContent = state.history.length;

    // Toggle empty state vs list
    const items = filteredHistory();
    const noItems = state.history.length === 0;
    const noMatches = !noItems && items.length === 0;

    els.clearAll.hidden = noItems;
    els.historyEmpty.hidden = !noItems && !noMatches;
    els.historyList.hidden = items.length === 0;

    if (noMatches && !noItems) {
      // Show a "no results" empty state by reusing the empty container with custom text
      els.historyEmpty.hidden = false;
      els.historyEmpty.innerHTML =
        '<div class="empty-title">' + esc(dict.historyEmpty) + '</div>' +
        '<div class="empty-hint">—</div>';
    } else if (noItems) {
      els.historyEmpty.innerHTML =
        '<div class="empty-title">' + esc(dict.historyEmpty) + '</div>' +
        '<div class="empty-hint">' + esc(dict.historyEmptyHint) + '</div>';
    }

    if (items.length === 0) {
      els.historyList.innerHTML = '';
      return;
    }

    const html = items.map(it => {
      const isRenaming = state.renamingId === it.id;
      const main = isRenaming
        ? '<input class="alias-input" type="text" data-id="' + esc(it.id) + '" value="' + esc(it.alias) + '" placeholder="' + esc(dict.aliasPlaceholder) + '" autofocus />'
        : '<div class="row-title">' + esc(it.alias || prettyNumber(it)) + '</div>' +
          '<div class="row-sub">' +
            (it.alias ? '<span class="num">' + esc(prettyNumber(it)) + '</span><span>·</span>' : '') +
            '<span>' + esc(window.WO_relTime(it.lastOpened, state.lang)) + '</span>' +
          '</div>';
      return (
        '<div class="history-item" data-id="' + esc(it.id) + '">' +
          '<button type="button" class="star ' + (it.favorite ? 'is-fav' : '') + '" data-act="fav" title="' + esc(it.favorite ? dict.unfavorite : dict.favorite) + '">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (it.favorite ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2">' +
              '<path d="M12 2 14.6 8.4 21.5 9 16.2 13.7 17.9 20.5 12 17 6.1 20.5 7.8 13.7 2.5 9 9.4 8.4z" />' +
            '</svg>' +
          '</button>' +
          '<div class="row-main" data-act="pick">' + main + '</div>' +
          '<div class="row-actions">' +
            '<button type="button" class="icon-action" data-act="rename" title="' + esc(dict.rename) + '">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M16.5 4.5a2.121 2.121 0 1 1 3 3L7.5 19.5 3 21l1.5-4.5z" />' +
              '</svg>' +
            '</button>' +
            '<button type="button" class="icon-action" data-act="del" title="' + esc(dict.delete) + '">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    els.historyList.innerHTML = html;

    // Focus + select on rename input
    if (state.renamingId) {
      const inp = els.historyList.querySelector('.alias-input[data-id="' + cssEscape(state.renamingId) + '"]');
      if (inp) { inp.focus(); inp.select(); }
    }
  }

  function cssEscape(s) {
    return String(s).replace(/[\\"]/g, '\\$&');
  }

  // ── Actions ───────────────────────────────────────────
  function openChat() {
    if (!isValid()) return;
    const dial = dialOf(state.country);
    const num = digitsOf(state.number);
    upsertHistoryEntry({ dial, number: num, country: state.country, message: state.message });
    const link = currentLink();
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  function copyLink() {
    if (!isValid()) return;
    const dial = dialOf(state.country);
    const num = digitsOf(state.number);
    const link = currentLink();
    const after = () => {
      upsertHistoryEntry({ dial, number: num, country: state.country, message: state.message });
      els.copyLabel.textContent = t().copied;
      setTimeout(() => { els.copyLabel.textContent = t().copy; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(after).catch(() => fallbackCopy(link, after));
    } else {
      fallbackCopy(link, after);
    }
  }
  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); cb && cb(); } catch (_) {}
    document.body.removeChild(ta);
  }

  function toggleQR() {
    if (!isValid()) return;
    state.showQR = !state.showQR;
    els.qrBtn.classList.toggle('is-active', state.showQR);
    els.qrBtn.setAttribute('aria-pressed', state.showQR ? 'true' : 'false');
    els.qrPanel.hidden = !state.showQR;
    if (state.showQR) renderQR();
  }

  function pickHistoryItem(it) {
    state.country = it.country || 'BR';
    state.number = it.number;
    state.message = it.message || '';
    els.countrySelect.value = state.country;
    updateCountryChip();
    els.phone.value = state.number;
    els.message.value = state.message;
    updateValidity();
    els.phone.focus();
  }

  // ── Wire events ───────────────────────────────────────
  function wire() {
    // Language toggle
    els.langButtons.forEach(b => {
      b.addEventListener('click', () => {
        const next = b.dataset.lang;
        if (next === state.lang) return;
        state.lang = next;
        try { localStorage.setItem(STORAGE.lang, state.lang); } catch (_) {}
        // Force country list re-render in new language
        els.countrySelect.dataset.lang = '';
        applyI18n();
      });
    });

    // Theme toggle
    els.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      applyI18n(); // updates title/aria-label
    });

    // Country
    els.countrySelect.addEventListener('change', () => {
      state.country = els.countrySelect.value;
      updateCountryChip();
      if (state.showQR && isValid()) renderQR();
    });

    // Phone
    els.phone.addEventListener('input', () => {
      state.number = els.phone.value;
      updateValidity();
    });
    els.phone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); openChat(); }
    });

    // Message
    els.message.addEventListener('input', () => {
      state.message = els.message.value;
      if (state.showQR && isValid()) renderQR();
    });

    // Action buttons
    els.openBtn.addEventListener('click', openChat);
    els.copyBtn.addEventListener('click', copyLink);
    els.qrBtn.addEventListener('click', toggleQR);

    // History search
    els.historySearch.addEventListener('input', () => {
      state.search = els.historySearch.value;
      renderHistory();
    });
    els.clearAll.addEventListener('click', () => {
      const dict = t();
      if (window.confirm(dict.clearConfirm)) clearAllHistory();
    });

    // History list — delegated clicks
    els.historyList.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (!item) return;
      const id = item.dataset.id;
      const entry = state.history.find(p => p.id === id);
      if (!entry) return;
      const actEl = e.target.closest('[data-act]');
      const act = actEl && actEl.dataset.act;
      if (act === 'fav') {
        updateHistory(id, { favorite: !entry.favorite });
      } else if (act === 'del') {
        removeHistory(id);
      } else if (act === 'rename') {
        state.renamingId = id;
        renderHistory();
      } else if (act === 'pick') {
        if (state.renamingId === id) return; // clicking the input shouldn't pick
        pickHistoryItem(entry);
      }
    });

    // Rename input — save/cancel via delegation
    els.historyList.addEventListener('keydown', (e) => {
      const inp = e.target.closest('.alias-input');
      if (!inp) return;
      if (e.key === 'Enter') {
        const id = inp.dataset.id;
        updateHistory(id, { alias: inp.value.trim() });
        state.renamingId = null;
        renderHistory();
      } else if (e.key === 'Escape') {
        state.renamingId = null;
        renderHistory();
      }
    });
    els.historyList.addEventListener('blur', (e) => {
      const inp = e.target.closest && e.target.closest('.alias-input');
      if (!inp) return;
      const id = inp.dataset.id;
      if (state.renamingId === id) {
        updateHistory(id, { alias: inp.value.trim() });
        state.renamingId = null;
        renderHistory();
      }
    }, true);

    // Cmd/Ctrl-K focuses the number input
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        els.phone.focus();
        els.phone.select();
      }
    });
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    const versionEl = $('version');
    if (versionEl) versionEl.textContent = VERSION;

    applyTheme();
    renderCountryOptions();
    els.phone.value = state.number;
    els.message.value = state.message;
    applyI18n();
    updateValidity();
    wire();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
