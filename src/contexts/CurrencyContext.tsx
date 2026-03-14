import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type CurrencyCode = "USD" | "MWK";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  convert: (amountInUSD: number) => number;
  format: (amountInUSD: number) => string;
  symbol: string;
  label: string;
}

const EXCHANGE_RATE_MWK = 1730; // 1 USD ≈ 1,730 MWK

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<CurrencyCode>("MWK");

  const convert = useCallback(
    (amountInUSD: number) => {
      if (currency === "MWK") return amountInUSD * EXCHANGE_RATE_MWK;
      return amountInUSD;
    },
    [currency]
  );

  const symbol = currency === "USD" ? "$" : "MK";
  const label = currency === "USD" ? "USD" : "MWK";

  const format = useCallback(
    (amountInUSD: number) => {
      const converted = currency === "MWK" ? amountInUSD * EXCHANGE_RATE_MWK : amountInUSD;
      if (currency === "MWK") {
        return `MK ${converted.toLocaleString("en-MW", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
      return `$${converted.toFixed(2)}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, symbol, label }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
