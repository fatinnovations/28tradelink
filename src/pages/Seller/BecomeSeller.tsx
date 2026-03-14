import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import BecomeSeller from "@/components/Seller/BecomeSeller";

const BecomeSellerPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <BecomeSeller />
      </main>
      <Footer />
    </div>
  );
};

export default BecomeSellerPage;
