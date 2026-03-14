import { Facebook, Twitter, Instagram, Youtube, CreditCard, Shield, Truck, Headphones, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import airtelMoneyLogo from "@/assets/airtel-money-logo.png";
import tnmMpambaLogo from "@/assets/tnm-mpamba-logo.png";

const Footer = () => {
  const { t } = useTranslation();

  const footerLinks: Record<string, { label: string; to: string }[]> = {
    [t("customerService")]: [
      { label: t("helpCenter"), to: "/info/help-center" },
      { label: t("transactionServices"), to: "/info/transaction-services" },
      { label: t("feedbackSurvey"), to: "/info/help-center" },
    ],
    [t("shoppingWithUs")]: [
      { label: t("makingPayments"), to: "/info/making-payments" },
      { label: t("deliveryOptions"), to: "/info/delivery-options" },
      { label: t("buyerProtection"), to: "/info/buyer-protection" },
    ],
    [t("collaborateWithUs")]: [
      { label: t("partnerships"), to: "/info/partnerships" },
      { label: t("affiliateProgram"), to: "/info/affiliate-program" },
      { label: t("sellerCenter"), to: "/become-seller" },
    ],
    [t("payWith")]: [],
  };

  return (
    <footer className="bg-foreground text-background mt-12">
      {/* Trust Badges */}
      <div className="border-b border-white/10">
        <div className="container py-4 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/info/buyer-protection" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">{t("buyerProtection")}</p>
                <p className="text-sm text-white/60">{t("fullRefund")}</p>
              </div>
            </Link>
            <Link to="/info/delivery-options" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">{t("nationwideDeliveryTitle")}</p>
                <p className="text-sm text-white/60">{t("allDistricts")}</p>
              </div>
            </Link>
            <Link to="/info/making-payments" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">{t("securePayments")}</p>
                <p className="text-sm text-white/60">{t("securePayment100")}</p>
              </div>
            </Link>
            <Link to="/info/help-center" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">{t("support247")}</p>
                <p className="text-sm text-white/60">{t("alwaysHereToHelp")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold mb-4">{title}</h3>
              {title === t("payWith") ? (
                <div className="flex flex-wrap gap-3">
                  <div className="h-10 bg-white flex items-center justify-center">
                    <img src={airtelMoneyLogo} alt="Airtel Money" className="h-16 w-auto object-contain" />
                  </div>
                  <div className="h-10 bg-white flex items-center justify-center">
                    <img src={tnmMpambaLogo} alt="TNM Mpamba" className="h-16 w-auto object-contain" />
                  </div>
                  <div className="h-10 px-3 bg-white/10 flex items-center gap-2 justify-center">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Bank Transfer</span>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-sm text-white/70 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">28</span>
            </div>
            <span className="font-semibold">TradeLink</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Youtube className="w-4 h-4" />
            </a>
          </div>

          <p className="text-sm text-white/60">{t("allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
