import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import i18n from "@/i18n";

const translationCache = new Map<string, string>();

export function useTranslateMessage() {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const pendingRef = useRef<Set<string>>(new Set());

  const translate = useCallback(async (messageId: string, text: string, senderLang: string) => {
    const currentLang = i18n.language;

    // Same language, no translation needed
    if (senderLang === currentLang) return;

    const cacheKey = `${messageId}-${currentLang}`;
    
    // Already cached
    if (translationCache.has(cacheKey)) {
      setTranslations((prev) => ({ ...prev, [messageId]: translationCache.get(cacheKey)! }));
      return;
    }

    // Already pending
    if (pendingRef.current.has(cacheKey)) return;
    pendingRef.current.add(cacheKey);

    setLoading((prev) => ({ ...prev, [messageId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("translate-message", {
        body: { text, sourceLang: senderLang, targetLang: currentLang },
      });

      if (!error && data?.translatedText) {
        translationCache.set(cacheKey, data.translatedText);
        setTranslations((prev) => ({ ...prev, [messageId]: data.translatedText }));
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, [messageId]: false }));
      pendingRef.current.delete(cacheKey);
    }
  }, []);

  return { translations, loading, translate };
}
