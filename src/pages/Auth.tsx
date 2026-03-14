import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: t("signInFailed"),
        description: error.message === "Invalid login credentials" 
          ? t("invalidCredentials")
          : error.message,
      });
    } else {
      toast({
        title: t("welcomeBack") + "!",
        description: t("welcomeBackMsg"),
      });
      navigate("/");
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes("already registered")) {
        message = t("emailAlreadyRegistered");
      }
      toast({
        variant: "destructive",
        title: t("signUpFailed"),
        description: message,
      });
    } else {
      toast({
        title: t("accountCreated"),
        description: t("welcomeTo28"),
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold text-2xl">28</span>
              </div>
              <h1 className="text-2xl font-bold">
                {isSignUp ? t("createAccount") : t("welcomeBack")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isSignUp 
                  ? t("joinAndShop")
                  : t("signInToAccount")
                }
              </p>
            </div>

            {/* Toggle */}
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  !isSignUp ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  isSignUp ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t("signUp")}
              </button>
            </div>

            {/*i have implemented Sign In Form */}
            {!isSignUp && (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">{t("email")}</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...signInForm.register("email")}
                    />
                  </div>
                  {signInForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {signInForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signin-password">{t("password")}</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...signInForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {signInForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("signingIn") : t("signIn")}
                </Button>
              </form>
            )}

            {/*i'm done with Sign Up Form */}
            {isSignUp && (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">{t("fullName")}</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      {...signUpForm.register("fullName")}
                    />
                  </div>
                  {signUpForm.formState.errors.fullName && (
                    <p className="text-sm text-destructive mt-1">
                      {signUpForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-email">{t("email")}</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      {...signUpForm.register("email")}
                    />
                  </div>
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-password">{t("password")}</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      {...signUpForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-confirm">{t("confirmPassword")}</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      {...signUpForm.register("confirmPassword")}
                    />
                  </div>
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {signUpForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("creatingAccount") : t("createAccount")}
                </Button>
              </form>
            )}

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              {t("termsAgreement")}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
