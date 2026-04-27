// Variation A — "Centered minimalist".
// Single column. Big tagline at top. Form with country select + number + message.
// Action row (Open / Copy / QR). History list lives below, expanding when used.
// Whole thing is centered on a quiet warm-neutral page.

window.WO_VariantA = function VariantA({ tweaks }) {
  const [lang, setLang] = window.WO_useLang();
  const [theme, setTheme] = window.WO_useTheme();
  const t = window.WO_I18N[lang];

  const [country, setCountry] = useState(window.WO_detectCountry());
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const hist = window.WO_useHistory();
  const dial = (window.WO_COUNTRIES.find(c => c.code === country) || {}).dial || '55';
  const link = window.WO_buildWaLink(dial, number, message);
  const valid = number.replace(/\D/g, '').length >= 6;

  const open = () => {
    if (!valid) return;
    hist.upsert({ dial, number: number.replace(/\D/g, ''), country, message });
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  const copy = async () => {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(link);
      hist.upsert({ dial, number: number.replace(/\D/g, ''), country, message });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const onPick = (it) => {
    setCountry(it.country || 'BR');
    setNumber(it.number);
    setMessage(it.message || '');
    inputRef.current?.focus();
  };

  // Cmd/Ctrl-K focus shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Color tokens
  const isDark = theme === 'dark';
  const accent = tweaks.accent;
  const bg     = isDark ? '#0e1311' : '#f6f4ef';
  const fg     = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(20,30,25,0.92)';
  const muted  = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(20,30,25,0.5)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)';
  const surface = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <div style={{
      minHeight: '100%', height: '100%',
      background: bg, color: fg,
      fontFamily: tweaks.fontFamily,
      fontFeatureSettings: '"ss01","cv11"',
      display: 'flex', flexDirection: 'column',
      transition: 'background 200ms, color 200ms',
    }}>
      {/* top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: accent,
            display: 'grid', placeItems: 'center',
            color: '#fff',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7c-1.214 0-2.357-.31-3.354-.854L5 19l1.121-3.396A6.96 6.96 0 0 1 5 12z" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>WhatsOpener</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SegToggle
            value={lang}
            options={[{ k: 'pt', label: 'PT' }, { k: 'en', label: 'EN' }]}
            onChange={setLang}
            theme={theme}
          />
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? t.light : t.dark}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              width: 30, height: 30, display: 'grid', placeItems: 'center',
              borderRadius: 8, color: muted,
            }}
            onMouseEnter={e => e.currentTarget.style.background = chipBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* main */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '40px 32px 32px',
        gap: 32,
      }}>
        <div style={{ maxWidth: 540, width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: tweaks.density === 'spacious' ? 44 : 38,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              fontWeight: 600,
              textWrap: 'balance',
            }}>{t.tagline}</h1>
          </div>

          {/* Number row */}
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 0,
            border: '1px solid ' + border,
            borderRadius: 14,
            background: surface,
            overflow: 'hidden',
            transition: 'border-color 120ms',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '0 14px',
              borderRight: '1px solid ' + border,
              fontSize: 15,
            }}>
              <window.WO_CountrySelect value={country} onChange={setCountry} lang={lang} />
            </div>
            <input
              ref={inputRef}
              value={number}
              onChange={e => setNumber(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') open(); }}
              placeholder={t.phonePlaceholder}
              inputMode="tel"
              autoComplete="off"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                color: fg, padding: '18px 16px',
                fontSize: 18, fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Message field */}
          <div>
            <label style={{ fontSize: 12, color: muted, fontWeight: 500, marginBottom: 8, display: 'block' }}>
              {t.message}
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder}
              rows={2}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid ' + border, borderRadius: 12,
                background: surface, color: fg,
                padding: '12px 14px',
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', minHeight: 56,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={open}
              disabled={!valid}
              style={{
                flex: '1 1 200px',
                border: 'none', borderRadius: 12,
                background: valid ? accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                color: valid ? '#fff' : muted,
                padding: '14px 18px',
                fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                cursor: valid ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 120ms, transform 80ms',
              }}
              onMouseDown={e => valid && (e.currentTarget.style.transform = 'scale(0.99)')}
              onMouseUp={e => e.currentTarget.style.transform = ''}
            >
              {t.open}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </button>
            <button
              onClick={copy}
              disabled={!valid}
              style={{
                border: '1px solid ' + border, borderRadius: 12,
                background: 'transparent', color: fg,
                padding: '13px 16px',
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                cursor: valid ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                opacity: valid ? 1 : 0.5,
              }}
            >
              {copied ? t.copied : t.copy}
            </button>
            <button
              onClick={() => setShowQR(v => !v)}
              disabled={!valid}
              style={{
                border: '1px solid ' + border, borderRadius: 12,
                background: showQR ? chipBg : 'transparent', color: fg,
                padding: '13px 14px',
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                cursor: valid ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                opacity: valid ? 1 : 0.5,
              }}
              title={t.qr}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14h1v1M14 20h3M20 17v4" />
              </svg>
              {t.qr}
            </button>
          </div>

          {/* QR collapse */}
          {showQR && valid && (
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center',
              padding: 16,
              border: '1px solid ' + border, borderRadius: 14,
              background: surface,
            }}>
              <div style={{
                background: '#fff', padding: 8, borderRadius: 8,
                display: 'grid', placeItems: 'center',
              }}>
                <window.WO_QRPanel link={link} size={140} fg="#0e1a14" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: muted, minWidth: 0, flex: 1 }}>
                <div style={{ color: fg, fontWeight: 500 }}>{t.qrHint}</div>
                <div style={{
                  fontSize: 12, fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}>{link}</div>
              </div>
            </div>
          )}

          {/* keyboard hint */}
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: muted, marginTop: -8 }}>
            <span><Kbd theme={theme}>Enter</Kbd> {t.enterDesc}</span>
            <span><Kbd theme={theme}>⌘K</Kbd> {t.cmdKDesc}</span>
          </div>

          {/* History */}
          <div style={{
            marginTop: 8,
            display: 'flex', flexDirection: 'column', gap: 12,
            paddingTop: 24, borderTop: '1px solid ' + border,
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: muted }}>
                {t.history}
              </h2>
              <span style={{ fontSize: 11, color: muted }}>{hist.items.length}</span>
            </div>
            <window.WO_HistoryList hist={hist} lang={lang} onPick={onPick} theme={theme} accent={accent} />
          </div>

          <window.WO_Footer lang={lang} theme={theme} />
        </div>
      </main>
    </div>
  );
};

function SegToggle({ value, options, onChange, theme }) {
  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const knob = isDark ? 'rgba(255,255,255,0.12)' : '#fff';
  const fg = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(20,30,25,0.92)';
  const muted = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(20,30,25,0.5)';
  return (
    <div style={{
      display: 'inline-flex', background: bg, borderRadius: 8, padding: 2,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
    }}>
      {options.map(o => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          style={{
            border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
            background: value === o.k ? knob : 'transparent',
            color: value === o.k ? fg : muted,
            boxShadow: value === o.k && !isDark ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

function Kbd({ children, theme }) {
  const isDark = theme === 'dark';
  return (
    <kbd style={{
      display: 'inline-block',
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      borderRadius: 4, padding: '1px 5px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 10,
      border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
      marginRight: 4,
    }}>{children}</kbd>
  );
}

window.WO_SegToggle = SegToggle;
window.WO_Kbd = Kbd;
