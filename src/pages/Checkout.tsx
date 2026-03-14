import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useOrder } from "@/contexts/OrderContext";
import { useCartItems, useClearCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { DeliveryAddress, PaymentMethod, Order } from "@/types/order";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import CheckoutSteps from "@/components/Checkout/CheckoutSteps";
import ShippingForm from "@/components/Checkout/ShippingForm";
import PaymentForm from "@/components/Checkout/PaymentForm";
import OrderReview from "@/components/Checkout/OrderReview";
import OrderSuccess from "@/components/Checkout/OrderSuccess";
import PaymentStatusDialog from "@/components/Checkout/PaymentStatusDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Checkout = () => {
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrency();
  const { currentOrder, setShippingAddress, setPaymentMethod } = useOrder();
  const { data: cartItems, isLoading } = useCartItems();
  const createOrderMutation = useCreateOrder();
  const clearCartMutation = useClearCart();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingOperator, setPendingOperator] = useState("");

  const steps = [
    { title: t("delivery"), description: t("deliveryAddress") },
    { title: t("paymentMethod"), description: t("paymentMethod") },
    { title: t("reviewOrder"), description: t("placeOrder") },
  ];

  const items = cartItems || [];
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * (item.quantity || 1), 0);

  const handleShippingSubmit = (data: DeliveryAddress) => {
    setShippingAddress(data);
    setCurrentStep(1);
  };

  const handlePaymentSubmit = (data: PaymentMethod) => {
    setPaymentMethod(data);
    setCurrentStep(2);
  };

  const handleConfirmOrder = async () => {
    if (!currentOrder?.shippingAddress || !currentOrder?.paymentMethod) {
      toast.error(t("missingInfo"));
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity || 1,
          price: item.product.price,
        })),
        shippingAddress: {
          full_name: currentOrder.shippingAddress.fullName,
          phone: currentOrder.shippingAddress.phone,
          address: currentOrder.shippingAddress.address,
          city: currentOrder.shippingAddress.tradePlace || "",
          state: currentOrder.shippingAddress.area || "",
          zip_code: "",
          country: currentOrder.shippingAddress.district,
        },
        paymentMethod: {
          type: currentOrder.paymentMethod.type,
          last4: currentOrder.paymentMethod.phoneNumber?.slice(-4) || currentOrder.paymentMethod.accountNumber?.slice(-4),
        },
        subtotal: totalPrice,
        shippingCost: 0,
        tax: 0,
        total: totalPrice,
      };

      const dbOrder = await createOrderMutation.mutateAsync(orderData);

      // For mobile money payments, initialize PayChangu STK push
      if (currentOrder.paymentMethod.type === "airtel_money" || currentOrder.paymentMethod.type === "mpamba") {
        const operator = currentOrder.paymentMethod.type === "airtel_money" ? "airtel" : "tnm";
        const phone = (currentOrder.paymentMethod.phoneNumber || "").replace(/\D/g, "");

        if (!phone || phone.length < 10) {
          throw new Error("Missing or invalid mobile money phone number");
        }

        const callbackUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/paychangu-webhook`;
        const returnUrl = `${window.location.origin}/orders`;

        const { data: payData, error: payError } = await supabase.functions.invoke("paychangu-payment", {
          body: {
            orderId: dbOrder.id,
            amount: totalPrice,
            currency: "MWK",
            firstName: currentOrder.shippingAddress.fullName.split(" ")[0],
            lastName: currentOrder.shippingAddress.fullName.split(" ").slice(1).join(" "),
            phone,
            operator,
            callbackUrl,
            returnUrl,
          },
        });

        if (payError) throw payError;
        if (!payData?.success) {
          throw new Error(payData?.error || "Failed to initialize payment");
        }

        // Show payment dialog with polling
        setPendingOrderId(dbOrder.id);
        setPendingPhone(phone);
        setPendingOperator(operator);
        setPaymentDialogOpen(true);
        setIsProcessing(false);
        return;
      }

      // For bank transfer, show success directly
      finishOrder(dbOrder);
    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error(t("failedPlaceOrder"));
      setIsProcessing(false);
    }
  };

  const finishOrder = (dbOrder: any) => {
    if (!currentOrder?.shippingAddress || !currentOrder?.paymentMethod) return;
    
    const order: Order = {
      id: dbOrder.id,
      items: items.map(i => ({ product: i.product as any, quantity: i.quantity || 1 })),
      shippingAddress: currentOrder.shippingAddress,
      paymentMethod: currentOrder.paymentMethod,
      subtotal: totalPrice,
      shippingCost: 0,
      total: totalPrice,
      status: "confirmed",
      createdAt: new Date(dbOrder.created_at),
      estimatedDelivery: dbOrder.estimated_delivery ? new Date(dbOrder.estimated_delivery) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      trackingNumber: dbOrder.tracking_number || `TRK${Date.now().toString(36).toUpperCase()}`,
      trackingEvents: [
        {
          status: "confirmed",
          description: t("orderConfirmedDesc"),
          timestamp: new Date(),
        },
      ],
    };

    setCompletedOrder(order);
    setIsProcessing(false);
    toast.success(t("orderPlacedSuccess"));
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    toast.success(t("orderPlacedSuccess"));
    navigate("/orders");
  };

  const handlePaymentFailed = () => {
    setPaymentDialogOpen(false);
    toast.error("Payment was not completed. Please try again.");
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialogOpen(false);
    navigate("/orders");
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <OrderSuccess order={completedOrder} />
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><Skeleton className="h-96 w-full" /></div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("yourCartIsEmpty")}</h1>
          <p className="text-muted-foreground mb-6">{t("nothingInCart")}</p>
          <Link to="/">
            <Button>{t("continueShopping")}</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const reviewItems = items.map(i => ({
    product: {
      id: i.product.id,
      title: i.product.title,
      price: i.product.price,
      image: i.product.image || "/placeholder.svg",
      originalPrice: i.product.original_price || undefined,
      rating: i.product.rating || 0,
      reviews: i.product.reviews || 0,
      sold: i.product.sold || 0,
      freeShipping: i.product.free_shipping || false,
      storeId: i.product.store_id,
    },
    quantity: i.quantity || 1,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t("home")}</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/cart" className="hover:text-primary">{t("cart")}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{t("checkout")}</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">{t("checkout")}</h1>

        <CheckoutSteps currentStep={currentStep} steps={steps} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow-sm p-6">
              {currentStep === 0 && (
                <ShippingForm
                  onSubmit={handleShippingSubmit}
                  defaultValues={currentOrder?.shippingAddress}
                />
              )}

              {currentStep === 1 && (
                <PaymentForm
                  onSubmit={handlePaymentSubmit}
                  onBack={() => setCurrentStep(0)}
                />
              )}

              {currentStep === 2 && currentOrder?.shippingAddress && currentOrder?.paymentMethod && (
                <OrderReview
                  items={reviewItems as any}
                  shippingAddress={currentOrder.shippingAddress}
                  paymentMethod={currentOrder.paymentMethod}
                  subtotal={totalPrice}
                  onConfirm={handleConfirmOrder}
                  onBack={() => setCurrentStep(1)}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-4 sticky top-24">
              <h2 className="font-bold text-lg mb-4">{t("orderSummary")}</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{item.product.title}</p>
                      <p className="text-xs text-muted-foreground">{t("quantity")}: {item.quantity || 1}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.product.price * (item.quantity || 1))}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("delivery")}</span>
                  <span className="text-green-600 font-medium">{t("free")}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>{t("total")}</span>
                  <span className="text-price">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <PaymentStatusDialog
        open={paymentDialogOpen}
        orderId={pendingOrderId}
        phoneNumber={pendingPhone}
        operator={pendingOperator}
        onSuccess={handlePaymentSuccess}
        onFailed={handlePaymentFailed}
        onClose={handlePaymentDialogClose}
      />
    </div>
  );
};

export default Checkout;
