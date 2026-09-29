'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { settingsApi } from '../lib/api';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal (SAR)', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SGD)', flag: '🇸🇬', locale: 'en-SG' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', flag: '🇯🇵', locale: 'ja-JP' },
];

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  currencyDetails: CurrencyOption;
  setCurrency: (code: string) => void;
  saveCurrency: (code: string) => Promise<void>;
  formatCurrency: (amount?: number | null, customCurrency?: string) => string;
  supportedCurrencies: CurrencyOption[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('INR');

  useEffect(() => {
    // 1. Initial immediate fallback from local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_currency');
      if (stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored)) {
        setCurrencyState(stored);
      }
    }

    // 2. Fetch from backend settings
    settingsApi
      .getSettings()
      .then((data) => {
        if (data?.crmCurrency && SUPPORTED_CURRENCIES.some((c) => c.code === data.crmCurrency)) {
          setCurrencyState(data.crmCurrency);
          if (typeof window !== 'undefined') {
            localStorage.setItem('crm_currency', data.crmCurrency);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load CRM currency from backend:', err);
      });
  }, []);

  const setCurrency = (code: string) => {
    const valid = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (valid) {
      setCurrencyState(valid.code);
      if (typeof window !== 'undefined') {
        localStorage.setItem('crm_currency', valid.code);
      }
    }
  };

  const saveCurrency = async (code: string) => {
    const valid = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (!valid) return;
    setCurrencyState(valid.code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_currency', valid.code);
    }
    await settingsApi.updateSettings({ crmCurrency: valid.code });
  };

  const currencyDetails =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const formatCurrency = (amount?: number | null, customCurrency?: string): string => {
    const num = amount ?? 0;
    const targetCode = customCurrency || currency;
    const targetOpt =
      SUPPORTED_CURRENCIES.find((c) => c.code === targetCode) || currencyDetails;
    
    // Format number nicely according to locale
    let formattedNumber: string;
    try {
      formattedNumber = num.toLocaleString(targetOpt.locale);
    } catch {
      formattedNumber = num.toLocaleString();
    }

    return `${targetOpt.symbol}${formattedNumber}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol: currencyDetails.symbol,
        currencyDetails,
        setCurrency,
        saveCurrency,
        formatCurrency,
        supportedCurrencies: SUPPORTED_CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
