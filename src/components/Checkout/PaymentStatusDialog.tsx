import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PaymentStatusDialogProps {
  open: boolean;
  orderId: string | null;
  phoneNumber: string;
  operator: string;
  onSuccess: () => void;
  onFailed: () => void;
  onClose: () => void;
}

type PaymentState = "waiting" | "paid" | "failed" | "timeout";

const PaymentStatusDialog = ({
  open,
  orderId,
  phoneNumber,
  operator,
  onSuccess,
  onFailed,
  onClose,
}: PaymentStatusDialogProps) => {
  const [state, setState] = useState<PaymentState>("waiting");
  const [elapsed, setElapsed] = useState(0);

  const TIMEOUT_SECONDS = 120; // 2 minutes

  useEffect(() => {
    if (!open || !orderId) return;
    setState("waiting");
    setElapsed(0);

    let pollInterval: number | undefined;
    let timerInterval: number | undefined;

    const stopPolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timerInterval) clearInterval(timerInterval);
    };

    // Poll order payment_status every 5 seconds
    pollInterval = window.setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .maybeSingle();

      if (data?.payment_status === "paid") {
        setState("paid");
        stopPolling();
      } else if (data?.payment_status === "failed") {
        setState("failed");
        stopPolling();
      }
    }, 5000);

    // Elapsed timer
    timerInterval = window.setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= TIMEOUT_SECONDS) {
          setState((s) => {
            if (s === "waiting") {
              stopPolling();
              return "timeout";
            }
            return s;
          });
        }
        return next;
      });
    }, 1000);

    return () => stopPolling();
  }, [open, orderId]);

  const maskedPhone =
    phoneNumber.length > 6
      ? phoneNumber.slice(0, 4) + "****" + phoneNumber.slice(-2)
      : phoneNumber;

  const operatorName = operator === "airtel" ? "Airtel Money" : "TNM Mpamba";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {state === "waiting" && "Approve Payment on Your Phone"}
            {state === "paid" && "Payment Successful!"}
            {state === "failed" && "Payment Failed"}
            {state === "timeout" && "Payment Timed Out"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {state === "waiting" &&
              `A payment prompt has been sent to your ${operatorName} number (${maskedPhone}). Enter your PIN to approve.`}
            {state === "paid" && "Your payment has been received successfully."}
            {state === "failed" &&
              "The payment was not completed. Please try again."}
            {state === "timeout" &&
              "We didn't receive a response in time. The payment may still be processing — check your orders."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          {state === "waiting" && (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">
                Waiting for PIN approval... {Math.floor((TIMEOUT_SECONDS - elapsed) / 60)}:
                {String((TIMEOUT_SECONDS - elapsed) % 60).padStart(2, "0")}
              </p>
            </>
          )}

          {state === "paid" && (
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          )}

          {(state === "failed" || state === "timeout") && (
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {state === "paid" && (
            <Button className="flex-1" onClick={onSuccess}>
              View Order
            </Button>
          )}
          {state === "failed" && (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={onFailed}>
                Try Again
              </Button>
            </>
          )}
          {state === "timeout" && (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={onSuccess}>
                Check Orders
              </Button>
            </>
          )}
          {state === "waiting" && (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentStatusDialog;
