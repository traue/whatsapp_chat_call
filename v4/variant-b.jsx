// Variation B — "Two-pane / sidebar".
// Left: form on big breathing space, with sticky bottom action bar.
// Right: history sidebar always visible (collapses to bottom drawer on narrow widths,
// but in a fixed artboard it stays as a column).
// Heavier visual hierarchy; uses an accent strip and a subtle gradient.

window.WO_VariantB = function VariantB({ tweaks }) {
  const [lang, setLang] = window.WO_useLang();
  const [theme, setTheme] = window.WO_useTheme();
  const t = window.WO_I18N[lang];

  const [country, setCountry] = useState(window.WO_detectCountry());
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
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

  const isDark = theme === 'dark';
  const accent = tweaks.accent;
  const bg     = isDark ? '#0d1311' : '#fbfaf6';
  const sidebarBg = isDark ? '#11181a' : '#f1ede4';
  const fg     = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(20,30,25,0.92)';
  const muted  = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(20,30,25,0.5)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)';
  const surface = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const chipBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <div style={{
      height: '100%',
      background: bg, color: fg,
      fontFamily: tweaks.fontFamily,
      fontFeatureSettings: '"ss01","cv11"',
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      transition: 'background 200ms, color 200ms',
    }}>
      {/* LEFT — main */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
        {/* accent strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} 30%, transparent 100%)`,
        }} />

        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 36px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'transparent',
              border: '1.5px solid ' + accent,
              display: 'grid', placeItems: 'center',
              color: accent,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7-3.134 7-7 7c-1.214 0-2.357-.31-3.354-.854L5 19l1.121-3.396A6.96 6.96 0 0 1 5 12z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>WhatsOpener</div>
              <div style={{ fontSize: 11, color: muted }}>{t.taglineShort}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <window.WO_SegToggle
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

        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '40px 56px 32px',
          gap: 28,
          overflow: 'auto',
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: accent, marginBottom: 14,
            }}>{t.appName}</div>
            <h1 style={{
              margin: 0,
              fontSize: tweaks.density === 'spacious' ? 56 : 48,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              fontWeight: 600,
              textWrap: 'balance',
              maxWidth: 600,
            }}>{t.tagline}</h1>
          </div>

          {/* Card */}
          <div style={{
            border: '1px solid ' + border,
            borderRadius: 18,
            background: surface,
            padding: 24,
            display: 'flex', flexDirection: 'column', gap: 18,
            maxWidth: 640,
            boxShadow: isDark ? 'none' : '0 1px 0 rgba(0,0,0,0.02), 0 24px 48px -32px rgba(20,30,25,0.12)',
          }}>
            {/* Country + number */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{t.phone}</label>
              <div style={{
                display: 'flex', alignItems: 'stretch',
                border: '1px solid ' + border,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '0 14px',
                  borderRight: '1px solid ' + border,
                  background: chipBg,
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
                    color: fg, padding: '16px 16px',
                    fontSize: 18, fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Message */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{t.message}</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1px solid ' + border, borderRadius: 12,
                  background: 'transparent', color: fg,
                  padding: '12px 14px',
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', minHeight: 56,
                }}
              />
            </div>

            {/* Inline QR (always visible when valid) */}
            <div style={{
              display: 'grid', gridTemplateColumns: valid ? '1fr 116px' : '1fr',
              gap: 16, alignItems: 'stretch',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={open}
                  disabled={!valid}
                  style={{
                    border: 'none', borderRadius: 12,
                    background: valid ? accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    color: valid ? '#fff' : muted,
                    padding: '16px 20px',
                    fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
                    cursor: valid ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 120ms, transform 80ms',
                  }}
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
                    padding: '12px 16px',
                    fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                    cursor: valid ? 'pointer' : 'not-allowed',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: valid ? 1 : 0.5,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </svg>
                  {copied ? t.copied : t.copy}
                </button>
              </div>
              {valid && (
                <div style={{
                  background: '#fff', padding: 8, borderRadius: 12,
                  display: 'grid', placeItems: 'center',
                  border: '1px solid ' + border,
                }}>
                  <window.WO_QRPanel link={link} size={100} fg="#0e1a14" />
                </div>
              )}
            </div>

            {/* link preview */}
            {valid && (
              <div style={{
                fontSize: 11, color: muted,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                paddingTop: 4, borderTop: '1px dashed ' + border,
              }}>{link}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: muted }}>
            <span><window.WO_Kbd theme={theme}>Enter</window.WO_Kbd> {t.enterDesc}</span>
            <span><window.WO_Kbd theme={theme}>⌘K</window.WO_Kbd> {t.cmdKDesc}</span>
          </div>

          <div style={{ flex: 1 }} />

          <window.WO_Footer lang={lang} theme={theme} />
        </main>
      </div>

      {/* RIGHT — history sidebar */}
      <aside style={{
        background: sidebarBg,
        borderLeft: '1px solid ' + border,
        display: 'flex', flexDirection: 'column',
        padding: '24px 20px',
        gap: 16,
        minHeight: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <h2 style={{
            margin: 0, fontSize: 13, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: muted,
          }}>{t.history}</h2>
          <span style={{ fontSize: 11, color: muted, fontVariantNumeric: 'tabular-nums' }}>
            {hist.items.length}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <window.WO_HistoryList hist={hist} lang={lang} onPick={onPick} theme={theme} accent={accent} compact />
        </div>
      </aside>
    </div>
  );
};
