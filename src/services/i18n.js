import { derived } from 'svelte/store';
import { dictionary, locale, _, init } from 'svelte-i18n';

const MESSAGE_FILE_URL_TEMPLATE = '/lang/{locale}.json';

let cachedLocale;

function setupI18n({ withLocale }) {
  console.log(withLocale)
  const _locale = supported(withLocale) || fallbackLocale;
  
  const messsagesFileUrl = MESSAGE_FILE_URL_TEMPLATE.replace('{locale}', _locale);

  return fetch(messsagesFileUrl)
    .then(response => response.json())
    .then((messages) => {
      dictionary.set({ [_locale]: messages });

      cachedLocale = _locale;

      locale.set(_locale);
      init({
        fallbackLocale: 'en',
        initialLocale: 'en'
        // initialLocale: _locale,
      });
    });
}

function formatDate(date, options) {
    return new Intl.DateTimeFormat(cachedLocale, options)
        .format(new Date(date));
}

const isLocaleLoaded = derived(locale, $locale => typeof $locale === 'string');

const dir = derived(locale, $locale => $locale === 'ar' ? 'rtl' : 'ltr');

const locales = {
  en: "English",
  'en-us': "English (US)",
};

const supported = (locale) => {
  console.log(locale);
  if (Object.keys(locales).includes(locale.toLowerCase())) {
    return locale;
  } else {
    return 'en';
  }
}

export { _, locale, dir, setupI18n, formatDate, isLocaleLoaded };