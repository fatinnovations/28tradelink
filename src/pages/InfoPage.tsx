import { useParams, Link } from "react-router-dom";
import { ChevronRight, Shield, Truck, CreditCard, Headphones, HelpCircle, FileText, Users, Gift, Smartphone } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

const infoPages: Record<string, { title: string; icon: React.ElementType; content: string[] }> = {
  "help-center": {
    title: "Help Center",
    icon: HelpCircle,
    content: [
      "Welcome to the 28TradeLink Help Center. We're here to help you with any questions or concerns.",
      "How to Place an Order: Browse products, add items to your cart, and proceed to checkout. You can pay using various payment methods.",
      "Order Tracking: After placing an order, you can track it from your Orders page. You'll receive updates as your order progresses.",
      "Returns & Refunds: If you're not satisfied with your purchase, you can request a return within 15 days of delivery.",
      "Contact Support: For additional help, reach out through our Messages feature or email support@28tradelink.com.",
    ],
  },
  "buyer-protection": {
    title: "Buyer Protection",
    icon: Shield,
    content: [
      "28TradeLink Buyer Protection ensures a safe shopping experience for every customer.",
      "Full Refund Guarantee: Get a full refund if your item isn't as described or doesn't arrive.",
      "Secure Payments: All transactions are encrypted and processed through secure payment gateways.",
      "Dispute Resolution: Our team mediates between buyers and sellers to resolve any issues fairly.",
      "Quality Assurance: We verify sellers and monitor product quality to maintain marketplace standards.",
    ],
  },
  "delivery-options": {
    title: "Delivery Options",
    icon: Truck,
    content: [
      "We offer multiple shipping options to suit your needs.",
      "Standard Shipping: 15-30 business days. Free on orders over $29.",
      "Express Shipping: 7-15 business days. Available at checkout for an additional fee.",
      "Economy Shipping: 30-60 business days. The most affordable option for non-urgent orders.",
      "Tracking: All orders come with tracking numbers so you can monitor your shipment's progress.",
    ],
  },
  "making-payments": {
    title: "Making Payments",
    icon: CreditCard,
    content: [
      "We accept a variety of secure payment methods.",
      "Credit & Debit Cards: Visa, Mastercard, American Express, and more.",
      "Digital Wallets: PayPal, Apple Pay, Google Pay.",
      "Bank Transfer: Available in select regions.",
      "All payments are secured with industry-standard encryption to protect your financial information.",
    ],
  },
  "partnerships": {
    title: "Partnerships",
    icon: Users,
    content: [
      "Join forces with 28TradeLink and grow your business.",
      "Brand Partnerships: Collaborate with us to reach millions of buyers worldwide.",
      "Technology Partners: Integrate your solutions with our marketplace platform.",
      "Logistics Partners: Help us deliver products faster and more efficiently.",
      "Contact our partnerships team to explore opportunities.",
    ],
  },
  "affiliate-program": {
    title: "Affiliate Program",
    icon: Gift,
    content: [
      "Earn commissions by promoting 28TradeLink products.",
      "How It Works: Share product links, earn a commission on every sale made through your referral.",
      "Commission Rates: Earn up to 10% on qualifying purchases.",
      "Easy Tracking: Our dashboard provides real-time tracking of your earnings.",
      "Sign up today and start earning with 28TradeLink's affiliate program.",
    ],
  },
  "seller-center": {
    title: "Seller Center",
    icon: Users,
    content: [
      "Everything you need to succeed as a seller on 28TradeLink.",
      "Getting Started: Apply to become a seller, set up your store, and list your products.",
      "Seller Tools: Manage orders, track analytics, and communicate with buyers.",
      "Best Practices: Optimize your listings, provide excellent customer service, and grow your business.",
      "Support: Our seller support team is available to help you every step of the way.",
    ],
  },
  "transaction-services": {
    title: "Transaction Services Agreement",
    icon: FileText,
    content: [
      "This agreement governs the use of transaction services on the 28TradeLink platform.",
      "By using our platform, you agree to abide by our terms of service and transaction policies.",
      "Payment Processing: All payments are processed securely through our authorized payment partners.",
      "Dispute Resolution: We provide a fair dispute resolution process for both buyers and sellers.",
      "For the full agreement, please contact our legal team.",
    ],
  },
  "download-app": {
    title: "Download Our App",
    icon: Smartphone,
    content: [
      "Shop smarter with the 28TradeLink mobile app.",
      "Available on iOS and Android: Download from the App Store or Google Play.",
      "Exclusive App Deals: Get special discounts available only on the mobile app.",
      "Push Notifications: Stay updated on order status, deals, and new arrivals.",
      "Easy Shopping: Browse, buy, and track orders from anywhere.",
    ],
  },
};

const InfoPage = () => {
  const { slug } = useParams();
  const page = infoPages[slug || ""];

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <Link to="/" className="text-primary hover:underline">Return to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{page.title}</span>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{page.title}</h1>
          </div>

          <div className="space-y-4">
            {page.content.map((paragraph, index) => (
              <p key={index} className={`text-muted-foreground leading-relaxed ${index === 0 ? "text-foreground font-medium" : ""}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InfoPage;
