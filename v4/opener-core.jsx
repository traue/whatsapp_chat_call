// Shared opener components — used by both variation A and B.
// Provides:
//   useHistory()   — localStorage-backed history with alias/favorite/search/clear
//   useTheme()     — light/dark + i18n lang persisted to localStorage
//   <Opener/>      — number input with country select, message field, action row
//   <QRPanel/>     — visual QR code rendering
//   <HistoryList/> — list with search, favorites first, alias-rename, delete
//   <Footer/>      — BMC link + privacy footer

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const STORAGE = {
  history: 'wo:history:v1',
  theme:   'wo:theme:v1',
  lang:    'wo:lang:v1',
};

window.WO_useHistory = function useHistory() {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE.history);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE.history, JSON.stringify(items)); } catch {}
  }, [items]);

  const upsert = useCallback((entry) => {
    setItems(prev => {
      const key = entry.dial + ':' + entry.number;
      const existing = prev.find(p => (p.dial + ':' + p.number) === key);
      const merged = existing
        ? { ...existing, lastOpened: Date.now(), opens: (existing.opens || 1) + 1, message: entry.message ?? existing.message }
        : { id: key, dial: entry.dial, number: entry.number, country: entry.country, alias: '', favorite: false, message: entry.message || '', lastOpened: Date.now(), opens: 1 };
      const others = prev.filter(p => (p.dial + ':' + p.number) !== key);
      return [merged, ...others].slice(0, 200);
    });
  }, []);

  const update = useCallback((id, patch) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);
  const remove = useCallback((id) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);
  const clearAll = useCallback(() => setItems([]), []);
  return { items, upsert, update, remove, clearAll };
};

window.WO_useTheme = function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE.theme);
      if (v === 'light' || v === 'dark') return v;
    } catch {}
    return (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE.theme, theme); } catch {}
  }, [theme]);
  return [theme, setTheme];
};

window.WO_useLang = function useLang() {
  const [lang, setLang] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE.lang);
      if (v === 'pt' || v === 'en') return v;
    } catch {}
    return (navigator.language || '').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE.lang, lang); } catch {}
  }, [lang]);
  return [lang, setLang];
};

// ── QRPanel ─────────────────────────────────────────────
window.WO_QRPanel = function QRPanel({ link, size = 200, fg = '#0e1a14', bg = 'transparent', radius = 0 }) {
  const matrix = useMemo(() => {
    if (!link) return null;
    try { return window.WO_qrMatrix(link); } catch (e) { return null; }
  }, [link]);
  if (!matrix) return null;
  const { size: n, data } = matrix;
  const cell = size / n;
  const rects = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (data[y][x]) {
      rects.push(<rect key={x+'-'+y} x={x*cell} y={y*cell} width={cell+0.5} height={cell+0.5} rx={radius} ry={radius} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {bg !== 'transparent' && <rect width={size} height={size} fill={bg} />}
      <g fill={fg}>{rects}</g>
    </svg>
  );
};

// ── CountrySelect ───────────────────────────────────────
window.WO_CountrySelect = function CountrySelect({ value, onChange, lang, styleHint }) {
  const t = window.WO_I18N[lang];
  const c = window.WO_COUNTRIES.find(x => x.code === value) || window.WO_COUNTRIES[0];
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ fontSize: 18, marginRight: 6 }}>{c.flag}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>+{c.dial}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={t.country}
        style={{
          position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
          width: '100%', height: '100%', border: 'none', appearance: 'none', background: 'transparent',
        }}
      >
        {window.WO_COUNTRIES.map(opt => (
          <option key={opt.code} value={opt.code}>{opt.flag} {opt.name[lang]} (+{opt.dial})</option>
        ))}
      </select>
    </div>
  );
};

// ── HistoryList ─────────────────────────────────────────
window.WO_HistoryList = function HistoryList({
  hist, lang, onPick, theme, accent, compact = false,
}) {
  const t = window.WO_I18N[lang];
  const [q, setQ] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = hist.items;
    if (s) {
      arr = arr.filter(it =>
        (it.alias || '').toLowerCase().includes(s) ||
        it.number.includes(s) ||
        ('+' + it.dial + it.number).includes(s)
      );
    }
    return [...arr].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.lastOpened - a.lastOpened;
    });
  }, [hist.items, q]);

  const onPrettyNumber = (it) => {
    const c = window.WO_COUNTRIES.find(x => x.code === it.country);
    return (c ? c.flag + ' ' : '') + '+' + it.dial + ' ' + it.number;
  };

  const isDark = theme === 'dark';
  const surface = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const muted   = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(20,30,25,0.5)';
  const fg      = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(20,30,25,0.92)';

  const startRename = (it) => { setRenamingId(it.id); setRenameVal(it.alias || ''); };
  const saveRename  = () => { if (renamingId) hist.update(renamingId, { alias: renameVal.trim() }); setRenamingId(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', minHeight: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 10, background: surface, border: '1px solid ' + border,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: muted }}>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t.search}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            color: fg, fontSize: 14, fontFamily: 'inherit',
          }}
        />
        {hist.items.length > 0 && (
          <button
            onClick={() => { if (confirm(t.clearConfirm)) hist.clearAll(); }}
            title={t.clearAll}
            style={{
              border: 'none', background: 'transparent', color: muted, cursor: 'pointer',
              fontSize: 12, padding: '2px 6px', borderRadius: 6,
            }}
          >{t.clearAll}</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
          padding: '20px 4px', color: muted,
        }}>
          <div style={{ fontSize: 14, color: fg, fontWeight: 500 }}>{t.historyEmpty}</div>
          <div style={{ fontSize: 12 }}>{t.historyEmptyHint}</div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: compact ? 2 : 4,
          overflowY: 'auto', flex: 1, minHeight: 0, margin: '0 -4px', padding: '0 4px',
        }}>
          {filtered.map(it => (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: compact ? '8px 10px' : '10px 12px',
              borderRadius: 10,
              border: '1px solid transparent',
              transition: 'background 120ms, border-color 120ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = surface; e.currentTarget.style.borderColor = border; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <button
                onClick={() => hist.update(it.id, { favorite: !it.favorite })}
                title={it.favorite ? t.unfavorite : t.favorite}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  width: 22, height: 22, display: 'grid', placeItems: 'center', borderRadius: 6,
                  color: it.favorite ? accent : muted,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={it.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2 14.6 8.4 21.5 9 16.2 13.7 17.9 20.5 12 17 6.1 20.5 7.8 13.7 2.5 9 9.4 8.4z" />
                </svg>
              </button>

              <div
                onClick={() => onPick(it)}
                style={{ flex: 1, minWidth: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {renamingId === it.id ? (
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenamingId(null); }}
                    placeholder={t.aliasPlaceholder}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent', padding: 0,
                      color: fg, fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 500, color: fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {it.alias || onPrettyNumber(it)}
                  </div>
                )}
                <div style={{
                  fontSize: 11, color: muted,
                  display: 'flex', gap: 8, alignItems: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {it.alias && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{onPrettyNumber(it)}</span>}
                  {it.alias && <span>·</span>}
                  <span>{window.WO_relTime(it.lastOpened, lang)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 2, opacity: 0.7 }}>
                <button
                  onClick={() => startRename(it)}
                  title={t.rename}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: muted, padding: 4, borderRadius: 6 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16.5 4.5a2.121 2.121 0 1 1 3 3L7.5 19.5 3 21l1.5-4.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => hist.remove(it.id)}
                  title={t.delete}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: muted, padding: 4, borderRadius: 6 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Footer ──────────────────────────────────────────────
window.WO_Footer = function Footer({ lang, theme }) {
  const t = window.WO_I18N[lang];
  const isDark = theme === 'dark';
  const muted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(20,30,25,0.5)';
  const fg    = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(20,30,25,0.85)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  return (
    <footer style={{
      borderTop: '1px solid ' + border,
      padding: '20px 0 0',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 12,
      color: muted,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '60%' }}>
        <div>{t.privacy}</div>
        <div>{t.notWhatsapp}</div>
      </div>
      <a
        href="https://buymeacoffee.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          textDecoration: 'none',
          color: fg,
          padding: '8px 12px',
          borderRadius: 999,
          border: '1px solid ' + border,
          fontSize: 12, fontWeight: 500,
          transition: 'background 120ms, border-color 120ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
          <path d="M6 2v3M10 2v3M14 2v3" />
        </svg>
        <span>{t.coffee}</span>
      </a>
    </footer>
  );
};
