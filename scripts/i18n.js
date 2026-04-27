// Bilingual strings + helpers. PT-BR / EN.
window.WO_I18N = {
  pt: {
    appName: 'WhatsOpener',
    tagline: 'Abrir WhatsApp.',
    taglineShort: 'Sem salvar contato.',
    country: 'País',
    phone: 'Número',
    phonePlaceholder: 'DDD + número',
    message: 'Mensagem (opcional)',
    messagePlaceholder: 'Texto que abre junto na conversa…',
    open: 'Abrir conversa',
    copy: 'Copiar link',
    copied: 'Copiado!',
    qr: 'QR code',
    qrHint: 'Aponte a câmera para abrir no celular.',
    history: 'Histórico',
    historyEmpty: 'Seus números recentes aparecem aqui.',
    historyEmptyHint: 'Tudo fica salvo só no seu navegador.',
    search: 'Buscar no histórico…',
    favorites: 'Favoritos',
    recent: 'Recentes',
    clearAll: 'Limpar tudo',
    clearConfirm: 'Apagar todo o histórico?',
    rename: 'Renomear',
    aliasPlaceholder: 'Ex.: vendedor da OLX',
    delete: 'Remover',
    favorite: 'Favoritar',
    unfavorite: 'Desfavoritar',
    invalid: 'Número inválido',
    enterToOpen: 'Enter para abrir',
    coffee: 'Pague-me um café',
    coffeeSub: 'Se isto te ajudou, considere apoiar.',
    madeBy: 'Feito com cuidado.',
    privacy: 'Tudo salvo localmente. Nada vai pra nenhum servidor.',
    notWhatsapp: 'Sem afiliação com WhatsApp ou Meta.',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    lang: 'Idioma',
    keyboard: 'Atalhos',
    enter: 'Enter',
    enterDesc: 'abrir conversa',
    cmdK: '⌘K',
    cmdKDesc: 'focar no número',
    just: 'agora',
    minAgo: 'min',
    hAgo: 'h',
    dAgo: 'd',
  },
  en: {
    appName: 'WhatsOpener',
    tagline: 'Open WhatsApp.',
    taglineShort: 'No contact-saving needed.',
    country: 'Country',
    phone: 'Number',
    phonePlaceholder: 'Area code + number',
    message: 'Message (optional)',
    messagePlaceholder: 'Text to pre-fill in the chat…',
    open: 'Open chat',
    copy: 'Copy link',
    copied: 'Copied!',
    qr: 'QR code',
    qrHint: 'Point your phone camera to open it there.',
    history: 'History',
    historyEmpty: 'Your recent numbers will show up here.',
    historyEmptyHint: 'Everything stays in your browser only.',
    search: 'Search history…',
    favorites: 'Favorites',
    recent: 'Recent',
    clearAll: 'Clear all',
    clearConfirm: 'Erase the entire history?',
    rename: 'Rename',
    aliasPlaceholder: 'e.g. OLX seller',
    delete: 'Remove',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    invalid: 'Invalid number',
    enterToOpen: 'Press Enter to open',
    coffee: 'Buy me a coffee',
    coffeeSub: 'If this helped, consider supporting.',
    madeBy: 'Made with care.',
    privacy: 'Saved locally. Nothing leaves your browser.',
    notWhatsapp: 'Not affiliated with WhatsApp or Meta.',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    lang: 'Language',
    keyboard: 'Shortcuts',
    enter: 'Enter',
    enterDesc: 'open chat',
    cmdK: '⌘K',
    cmdKDesc: 'focus number',
    just: 'now',
    minAgo: 'm',
    hAgo: 'h',
    dAgo: 'd',
  },
};

// Country DDIs — ordered with common Latin-America-friendly defaults first,
// then alphabetical-ish.
window.WO_COUNTRIES = [
  { code: 'BR', dial: '55',  flag: '🇧🇷', name: { pt: 'Brasil',         en: 'Brazil' } },
  { code: 'PT', dial: '351', flag: '🇵🇹', name: { pt: 'Portugal',       en: 'Portugal' } },
  { code: 'US', dial: '1',   flag: '🇺🇸', name: { pt: 'Estados Unidos', en: 'United States' } },
  { code: 'AR', dial: '54',  flag: '🇦🇷', name: { pt: 'Argentina',      en: 'Argentina' } },
  { code: 'MX', dial: '52',  flag: '🇲🇽', name: { pt: 'México',         en: 'Mexico' } },
  { code: 'CO', dial: '57',  flag: '🇨🇴', name: { pt: 'Colômbia',       en: 'Colombia' } },
  { code: 'CL', dial: '56',  flag: '🇨🇱', name: { pt: 'Chile',          en: 'Chile' } },
  { code: 'PE', dial: '51',  flag: '🇵🇪', name: { pt: 'Peru',           en: 'Peru' } },
  { code: 'UY', dial: '598', flag: '🇺🇾', name: { pt: 'Uruguai',        en: 'Uruguay' } },
  { code: 'PY', dial: '595', flag: '🇵🇾', name: { pt: 'Paraguai',       en: 'Paraguay' } },
  { code: 'ES', dial: '34',  flag: '🇪🇸', name: { pt: 'Espanha',        en: 'Spain' } },
  { code: 'IT', dial: '39',  flag: '🇮🇹', name: { pt: 'Itália',         en: 'Italy' } },
  { code: 'FR', dial: '33',  flag: '🇫🇷', name: { pt: 'França',         en: 'France' } },
  { code: 'DE', dial: '49',  flag: '🇩🇪', name: { pt: 'Alemanha',       en: 'Germany' } },
  { code: 'GB', dial: '44',  flag: '🇬🇧', name: { pt: 'Reino Unido',    en: 'United Kingdom' } },
  { code: 'CA', dial: '1',   flag: '🇨🇦', name: { pt: 'Canadá',         en: 'Canada' } },
  { code: 'JP', dial: '81',  flag: '🇯🇵', name: { pt: 'Japão',          en: 'Japan' } },
  { code: 'CN', dial: '86',  flag: '🇨🇳', name: { pt: 'China',          en: 'China' } },
  { code: 'IN', dial: '91',  flag: '🇮🇳', name: { pt: 'Índia',          en: 'India' } },
  { code: 'AU', dial: '61',  flag: '🇦🇺', name: { pt: 'Austrália',      en: 'Australia' } },
];

window.WO_detectCountry = function detectCountry() {
  try {
    const lang = (navigator.language || '').toLowerCase();
    const region = lang.split('-')[1];
    if (region) {
      const hit = window.WO_COUNTRIES.find(c => c.code.toLowerCase() === region);
      if (hit) return hit.code;
    }
    if (lang.startsWith('pt')) return 'BR';
    return 'US';
  } catch (_) {
    return 'BR';
  }
};

window.WO_relTime = function relTime(ts, lang) {
  const t = window.WO_I18N[lang] || window.WO_I18N.pt;
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t.just;
  if (m < 60) return m + t.minAgo;
  const h = Math.floor(m / 60);
  if (h < 24) return h + t.hAgo;
  const d = Math.floor(h / 24);
  return d + t.dAgo;
};

window.WO_formatPhoneE164 = function formatPhoneE164(dial, raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return dial + digits;
};

window.WO_buildWaLink = function buildWaLink(dial, raw, message) {
  const e164 = window.WO_formatPhoneE164(dial, raw);
  if (!e164) return '';
  const base = 'https://wa.me/' + e164;
  if (message && message.trim()) {
    return base + '?text=' + encodeURIComponent(message.trim());
  }
  return base;
};
