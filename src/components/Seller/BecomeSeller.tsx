import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, CheckCircle, Clock, XCircle, Phone, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSellerApplication,
  useSubmitSellerApplication,
  useDeleteSellerApplication,
  useUserRoleCheck,
} from "@/hooks/useRoles";
import { toast } from "sonner";
import ImageUpload from "@/components/ui/image-upload";

const BecomeSeller = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSeller } = useUserRoleCheck();
  const { data: application, isLoading } = useSellerApplication();
  const submitApplication = useSubmitSellerApplication();
  const deleteApplication = useDeleteSellerApplication();

  const [storeName, setStoreName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalIdUrl, setNationalIdUrl] = useState("");
  const [businessCertificateUrl, setBusinessCertificateUrl] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error("Please enter a store name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!nationalIdUrl) {
      toast.error("Please upload your National ID");
      return;
    }
    if (!businessCertificateUrl) {
      toast.error("Please upload your Business Certificate");
      return;
    }

    try {
      await submitApplication.mutateAsync({
        storeName: storeName.trim(),
        businessDescription: businessDescription.trim() || undefined,
        phone: phone.trim(),
        nationalIdUrl,
        businessCertificateUrl,
      });
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("You have already submitted an application");
      } else {
        toast.error("Failed to submit application");
      }
    }
  };

  if (!user) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            Become a Seller
          </CardTitle>
          <CardDescription>
            Sign in to apply for a seller account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSeller) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="w-6 h-6" />
            You're a Seller!
          </CardTitle>
          <CardDescription>
            You already have seller privileges on this platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/seller/dashboard")} className="w-full">
            Go to Seller Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (application && !isResubmitting) {
    const handleResubmit = async () => {
      try {
        await deleteApplication.mutateAsync(application.id);
        setIsResubmitting(true);
        toast.success("You can now submit a new application");
      } catch {
        toast.error("Failed to delete application");
      }
    };

    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {application.status === "pending" && (
              <>
                <Clock className="w-6 h-6 text-warning" />
                Application Pending
              </>
            )}
            {application.status === "approved" && (
              <>
                <CheckCircle className="w-6 h-6 text-success" />
                Application Approved!
              </>
            )}
            {application.status === "rejected" && (
              <>
                <XCircle className="w-6 h-6 text-destructive" />
                Application Rejected
              </>
            )}
          </CardTitle>
          <CardDescription>
            {application.status === "pending" &&
              "Your seller application is being reviewed. We'll notify you once a decision is made."}
            {application.status === "approved" &&
              "Congratulations! Your seller application has been approved. You can now start selling."}
            {application.status === "rejected" &&
              (application.rejection_reason
                ? `Your application was not approved. Reason: "${application.rejection_reason}". You may resubmit after addressing the feedback.`
                : "Unfortunately, your application was not approved. You may resubmit a new application.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Store Name:</span>
              <p className="font-medium">{application.store_name}</p>
            </div>
            {application.business_description && (
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p>{application.business_description}</p>
              </div>
            )}
            {application.phone && (
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p>{application.phone}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Submitted:</span>
              <p>{new Date(application.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {application.status === "approved" && (
            <Button
              onClick={() => navigate("/seller/dashboard")}
              className="w-full mt-4"
            >
              Go to Seller Dashboard
            </Button>
          )}
          {application.status === "rejected" && (
            <Button
              onClick={handleResubmit}
              className="w-full mt-4"
              disabled={deleteApplication.isPending}
            >
              {deleteApplication.isPending ? "Processing..." : "Resubmit Application"}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-6 h-6" />
          Become a Seller
        </CardTitle>
        <CardDescription>
          Start selling on our platform. Fill out the application below and
          we'll review it shortly. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Store className="w-4 h-4" />
              Business Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter your store name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">
                Business Description (Optional)
              </Label>
              <Textarea
                id="businessDescription"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Tell us about your business and what you plan to sell..."
                rows={3}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+265 xxx xxx xxx"
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll use this to contact you about your application
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Required Documents
            </h3>

            <div className="space-y-2">
              <Label>National ID *</Label>
              <ImageUpload
                value={nationalIdUrl}
                onChange={setNationalIdUrl}
                folder="seller-documents"
                label=""
                description="Upload a clear photo of your National ID (front side)"
              />
            </div>

            <div className="space-y-2">
              <Label>Business Certificate *</Label>
              <ImageUpload
                value={businessCertificateUrl}
                onChange={setBusinessCertificateUrl}
                folder="seller-documents"
                label=""
                description="Upload your business registration certificate"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitApplication.isPending}
          >
            {submitApplication.isPending
              ? "Submitting..."
              : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BecomeSeller;
