import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const SUPPORTED_LANGS = ['cs', 'en', 'ja', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'sk', 'hu', 'ro', 'tr', 'ru', 'uk', 'ko', 'zh', 'ar', 'hi', 'el', 'th', 'id', 'vi', 'ms'] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGS],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'navigator'],
      caches: [],
      lookupQuerystring: 'lng',
    },
    // Resources are loaded on demand via the backend below
    partialBundledLanguages: true,
    resources: {},
  });

// Detect the language synchronously (same logic as LanguageDetector would use)
function detectLanguage(): string {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('lng');
  if (fromQuery && SUPPORTED_LANGS.includes(fromQuery as any)) return fromQuery;
  const nav = navigator.language?.split('-')[0] || 'en';
  return SUPPORTED_LANGS.includes(nav as any) ? nav : 'en';
}

// Load a language bundle and add it to i18n
async function loadLanguage(lang: string): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'translation')) return;
  try {
    const mod = await import(`./${lang}.ts`);
    i18n.addResourceBundle(lang, 'translation', mod.default, true, true);
  } catch {
    // Fallback: if the requested lang fails, load English
    if (lang !== 'en') await loadLanguage('en');
  }
}

// Bootstrap: load detected language (+ English fallback) before app renders
const detectedLang = detectLanguage();

export const i18nReady: Promise<void> = (async () => {
  await loadLanguage('en');
  if (detectedLang !== 'en') await loadLanguage(detectedLang);
  await i18n.changeLanguage(detectedLang);
})();

// When language changes at runtime, lazily load the new bundle
i18n.on('languageChanged', (lang: string) => {
  loadLanguage(lang);
});

export default i18n;
