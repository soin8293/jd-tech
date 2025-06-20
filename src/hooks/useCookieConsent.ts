
import { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

export const useCookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    
    if (!consent) {
      setShowBanner(true);
    } else if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    
    setPreferences(allAccepted);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    
    setPreferences(necessaryOnly);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(necessaryOnly));
    setShowBanner(false);
  };

  const savePreferences = (newPreferences: CookiePreferences) => {
    const updatedPreferences = {
      ...newPreferences,
      necessary: true, // Always required
    };
    
    setPreferences(updatedPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    setShowBanner(false);
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setShowBanner(true);
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  return {
    showBanner,
    preferences,
    acceptAll,
    acceptNecessary,
    savePreferences,
    resetConsent,
  };
};
