import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import cs from './cs';
import en from './en';
import ja from './ja';
import de from './de';
import fr from './fr';
import es from './es';
import pt from './pt';
import it from './it';
import nl from './nl';
import pl from './pl';
import sv from './sv';
import da from './da';
import no from './no';
import fi from './fi';
import sk from './sk';
import hu from './hu';
import ro from './ro';
import tr from './tr';
import ru from './ru';
import uk from './uk';
import ko from './ko';
import zh from './zh';
import ar from './ar';
import hi from './hi';
import el from './el';
import th from './th';
import id from './id';
import vi from './vi';
import ms from './ms';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      cs: { translation: cs },
      en: { translation: en },
      ja: { translation: ja },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      it: { translation: it },
      nl: { translation: nl },
      pl: { translation: pl },
      sv: { translation: sv },
      da: { translation: da },
      no: { translation: no },
      fi: { translation: fi },
      sk: { translation: sk },
      hu: { translation: hu },
      ro: { translation: ro },
      tr: { translation: tr },
      ru: { translation: ru },
      uk: { translation: uk },
      ko: { translation: ko },
      zh: { translation: zh },
      ar: { translation: ar },
      hi: { translation: hi },
      el: { translation: el },
      th: { translation: th },
      id: { translation: id },
      vi: { translation: vi },
      ms: { translation: ms },
    },
    fallbackLng: 'en',
    supportedLngs: ['cs', 'en', 'ja', 'de', 'fr', 'es', 'pt', 'it', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'sk', 'hu', 'ro', 'tr', 'ru', 'uk', 'ko', 'zh', 'ar', 'hi', 'el', 'th', 'id', 'vi', 'ms'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'navigator'],
      caches: [],
      lookupQuerystring: 'lng',
    },
  });

export default i18n;
