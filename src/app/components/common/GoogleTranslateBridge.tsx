import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

export const GoogleTranslateBridge = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    // Check if script is already added
    if (document.querySelector('script[src*="translate.google.com"]')) return;

    // 1. Load Google Translate Script
    const addScript = document.createElement('script');
    addScript.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
    document.body.appendChild(addScript);

    // 2. Initialize Function
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement({
        pageLanguage: 'ko',
        includedLanguages: 'ko,en,ja',
        autoDisplay: false,
      }, 'google_translate_element');
    };
  }, []);

  // 3. Trigger Translation when 'lang' changes
  useEffect(() => {
    if (!window.google || !window.google.translate) return;

    const translateTo = (targetLang: string) => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = targetLang;
        select.dispatchEvent(new Event('change'));
      }
    };

    // Mapping: 'jp' -> 'ja' for Google
    const googleLangCode = lang === 'jp' ? 'ja' : lang;
    
    // Retry finding the element until it loads
    const interval = setInterval(() => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        translateTo(googleLangCode);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);

  }, [lang]);

  return (
    // Hide the ugly Google widget visually, but keep it in DOM
    <div 
      id="google_translate_element" 
      className="fixed bottom-0 right-0 opacity-0 pointer-events-none z-[-1] notranslate"
      aria-hidden="true"
    />
  );
};