class I18n {
  constructor() {
    this.translations = {};
    this.supportedLanguages = ['ko', 'en', 'ja', 'zh', 'es', 'pt', 'id', 'tr', 'de', 'fr', 'hi', 'ru'];
    this.currentLang = this.detectLanguage();
    document.documentElement.lang = this.currentLang;
    this.initialized = false;
  }

  detectLanguage() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const urlLang = params.get('lang');
      if (urlLang && this.supportedLanguages.includes(urlLang)) {
        return urlLang;
      }
    } catch (error) {}

    // localStorage에서 저장된 언어 확인
    const saved = localStorage.getItem('appLanguage');
    if (saved && this.supportedLanguages.includes(saved)) {
      return saved;
    }

    // 브라우저 언어 확인
    const browserLang = navigator.language.split('-')[0];
    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    // 기본값: 한국어
    return 'ko';
  }

  async loadTranslations(lang) {
    try {
      const response = await fetch(`js/locales/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}`);
      const data = await response.json();
      this.translations = data;
      return true;
    } catch (error) {
      console.error('Translation loading failed:', error);
      // 실패 시 영어로 폴백
      if (lang !== 'en') {
        return this.loadTranslations('en');
      }
      return false;
    }
  }

  t(key) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // 키를 찾지 못하면 키 자체 반환
      }
    }

    return value;
  }

  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Language ${lang} not supported`);
      return false;
    }

    const success = await this.loadTranslations(lang);
    if (success) {
      this.currentLang = lang;
      localStorage.setItem('appLanguage', lang);
      document.documentElement.lang = lang;
      this.updateUI();
      return true;
    }
    return false;
  }

  updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.t(key);

      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.hasAttribute('placeholder')) {
          element.placeholder = text;
        }
      } else {
        element.textContent = text;
      }
    });
  }

  async initialize() {
    await this.loadTranslations(this.currentLang);
    this.updateUI();
    this.initialized = true;
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  getLanguageName(lang) {
    const names = {
      'ko': '한국어',
      'en': 'English',
      'ja': '日本語',
      'zh': '中文',
      'es': 'Español',
      'pt': 'Português',
      'id': 'Bahasa Indonesia',
      'tr': 'Türkçe',
      'de': 'Deutsch',
      'fr': 'Français',
      'hi': 'हिन्दी',
      'ru': 'Русский'
    };
    return names[lang] || lang;
  }

  getLanguageFlag(lang) {
    const flags = {
      'ko': '🇰🇷',
      'en': '🇺🇸',
      'ja': '🇯🇵',
      'zh': '🇨🇳',
      'es': '🇪🇸',
      'pt': '🇧🇷',
      'id': '🇮🇩',
      'tr': '🇹🇷',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'hi': '🇮🇳',
      'ru': '🇷🇺'
    };
    return flags[lang] || '🌐';
  }
}

// 전역 i18n 인스턴스
const i18n = new I18n();
