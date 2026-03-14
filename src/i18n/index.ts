import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import ny from "./locales/ny";
import tum from "./locales/tum";
import yao from "./locales/yao";
import sen from "./locales/sen";
import kde from "./locales/kde";
import ngo from "./locales/ngo";
import tog from "./locales/tog";
import lom from "./locales/lom";
import lam from "./locales/lam";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ny: { translation: ny },
      en: { translation: en },
      tum: { translation: tum },
      yao: { translation: yao },
      sen: { translation: sen },
      kde: { translation: kde },
      ngo: { translation: ngo },
      tog: { translation: tog },
      lom: { translation: lom },
      lam: { translation: lam },
    },
    lng: "ny", // Chichewa default
    fallbackLng: "ny",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;

export const languages = [
  { code: "ny", label: "Chichewa", nativeLabel: "Chichewa" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "tum", label: "Tumbuka", nativeLabel: "Chitumbuka" },
  { code: "yao", label: "Yao", nativeLabel: "Chiyao" },
  { code: "sen", label: "Sena", nativeLabel: "Chisena" },
  { code: "kde", label: "Konde", nativeLabel: "Chingonde" },
  { code: "ngo", label: "Ngoni", nativeLabel: "Chingoni" },
  { code: "tog", label: "Tonga", nativeLabel: "Chitonga" },
  { code: "lom", label: "Lomwe", nativeLabel: "Chilomwe" },
  { code: "lam", label: "Lambya", nativeLabel: "Chilambya" },
];
