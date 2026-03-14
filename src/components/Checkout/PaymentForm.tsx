import { useState } from "react";
import { Smartphone, Building2, Phone } from "lucide-react";
import { PaymentMethod } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
  onSubmit: (data: PaymentMethod) => void;
  onBack: () => void;
}

const BANKS = [
  "National Bank of Malawi",
  "Standard Bank Malawi",
  "FDH Bank",
  "NBS Bank",
  "CDH Investment Bank",
  "First Capital Bank",
  "Ecobank Malawi",
  "MyBucks Banking Corporation",
];

const PaymentForm = ({ onSubmit, onBack }: PaymentFormProps) => {
  const [paymentType, setPaymentType] = useState<PaymentMethod["type"]>("airtel_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (paymentType === "airtel_money" || paymentType === "mpamba") {
      if (phoneNumber.length < 10) {
        newErrors.phoneNumber = "Enter a valid phone number (e.g. 0991234567)";
      }
      if (paymentType === "airtel_money" && phoneNumber && !phoneNumber.startsWith("099") && !phoneNumber.startsWith("098")) {
        newErrors.phoneNumber = "Airtel number must start with 099 or 098";
      }
      if (paymentType === "mpamba" && phoneNumber && !phoneNumber.startsWith("088") && !phoneNumber.startsWith("089")) {
        newErrors.phoneNumber = "TNM number must start with 088 or 089";
      }
    }

    if (paymentType === "bank_transfer") {
      if (!bankName) newErrors.bankName = "Select a bank";
      if (accountNumber.length < 5) newErrors.accountNumber = "Enter a valid account number";
      if (accountName.length < 2) newErrors.accountName = "Enter account holder name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      type: paymentType,
      phoneNumber: paymentType !== "bank_transfer" ? phoneNumber : undefined,
      bankName: paymentType === "bank_transfer" ? bankName : undefined,
      accountNumber: paymentType === "bank_transfer" ? accountNumber : undefined,
      accountName: paymentType === "bank_transfer" ? accountName : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <RadioGroup
        value={paymentType}
        onValueChange={(v) => {
          setPaymentType(v as PaymentMethod["type"]);
          setErrors({});
        }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <Label
          htmlFor="airtel_money"
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
            paymentType === "airtel_money" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
          )}
        >
          <RadioGroupItem value="airtel_money" id="airtel_money" className="sr-only" />
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-destructive" />
          </div>
          <span className="text-sm font-medium">Airtel Money</span>
        </Label>

        <Label
          htmlFor="mpamba"
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
            paymentType === "mpamba" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
          )}
        >
          <RadioGroupItem value="mpamba" id="mpamba" className="sr-only" />
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium">TNM Mpamba</span>
        </Label>

        <Label
          htmlFor="bank_transfer"
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors",
            paymentType === "bank_transfer" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
          )}
        >
          <RadioGroupItem value="bank_transfer" id="bank_transfer" className="sr-only" />
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span className="text-sm font-medium">Bank Transfer</span>
        </Label>
      </RadioGroup>

      {/* Mobile Money Fields */}
      {(paymentType === "airtel_money" || paymentType === "mpamba") && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {paymentType === "airtel_money"
              ? "Enter your Airtel Money number. You will receive a prompt on your phone to confirm payment via PayChangu."
              : "Enter your TNM Mpamba number. You will receive a prompt on your phone to confirm payment via PayChangu."}
          </p>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder={paymentType === "airtel_money" ? "0991234567" : "0881234567"}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
              className={errors.phoneNumber ? "border-destructive" : ""}
            />
            {errors.phoneNumber && <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>}
          </div>
        </div>
      )}

      {/* Bank Transfer Fields */}
      {paymentType === "bank_transfer" && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Enter your bank details. You will receive bank transfer instructions after placing the order.
          </p>
          <div>
            <Label htmlFor="bankName">Bank</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className={errors.bankName ? "border-destructive" : ""}>
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bankName && <p className="text-sm text-destructive mt-1">{errors.bankName}</p>}
          </div>
          <div>
            <Label htmlFor="accountName">Account Holder Name</Label>
            <Input
              id="accountName"
              placeholder="John Banda"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={errors.accountName ? "border-destructive" : ""}
            />
            {errors.accountName && <p className="text-sm text-destructive mt-1">{errors.accountName}</p>}
          </div>
          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              className={errors.accountNumber ? "border-destructive" : ""}
            />
            {errors.accountNumber && <p className="text-sm text-destructive mt-1">{errors.accountNumber}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Review Order
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;
