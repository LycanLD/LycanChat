import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getStoredLanguage, setStoredLanguage, getTranslation, Translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [t, setTranslations] = useState<Translations>(getTranslation('en'));

  useEffect(() => {
    // Load language from localStorage on mount
    const storedLanguage = getStoredLanguage();
    setLanguageState(storedLanguage);
    setTranslations(getTranslation(storedLanguage));
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setTranslations(getTranslation(newLanguage));
    setStoredLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}