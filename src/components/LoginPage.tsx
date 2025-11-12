import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import type { LucideIcon } from "lucide-react";
import {
  UserPlus,
  LogIn,
  Mail,
  User,
  Sparkles,
  Zap,
  Star,
  AlertCircle,
  ShieldCheck,
  Gamepad2,
  Trophy,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "@tsparticles/react";

interface LoginPageProps {
  onLogin: (username: string) => void;
  initialTab?: "login" | "register";
  onBack?: () => void;
}

const apiBaseUrl = import.meta.env.VITE_BASE_API;
const puzzleApiUrl = "https://marcconrad.com/uob/banana/api.php";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterField = "username" | "email" | "password" | "confirmPassword";

type DialogTone = "success" | "error" | "info";

interface FeatureHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const featureHighlights: FeatureHighlight[] = [
  {
    icon: ShieldCheck,
    title: "Secure Progress",
    description: "JWT-powered sessions keep your banana stash safe and synced.",
    gradient: "from-emerald-400 via-emerald-500 to-green-500",
  },
  {
    icon: Gamepad2,
    title: "Arcade-Ready Controls",
    description: "Snappy event loops deliver buttery-smooth moves on every device.",
    gradient: "from-indigo-400 via-purple-500 to-pink-500",
  },
  {
    icon: Trophy,
    title: "Climb The Rankings",
    description: "Track high scores in real time and flex on the global leaderboard.",
    gradient: "from-amber-400 via-orange-500 to-red-500",
  },
];

const initialRegisterState = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type RegisterFormState = typeof initialRegisterState;

const initialRegisterErrors: Record<RegisterField, string> = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const initialRegisterTouched: Record<RegisterField, boolean> = {
  username: false,
  email: false,
  password: false,
  confirmPassword: false,
};

const dialogToneStyles: Record<DialogTone, { gradient: string; titleClass: string }> = {
  success: {
    gradient: "from-emerald-500 to-lime-500",
    titleClass: "text-emerald-600",
  },
  error: {
    gradient: "from-rose-500 to-orange-500",
    titleClass: "text-rose-600",
  },
  info: {
    gradient: "from-sky-500 to-indigo-500",
    titleClass: "text-sky-600",
  },
};

const scoreboardTeasers = [
  {
    label: "Today's Top Score",
    value: "98,720 pts",
    accent: "text-emerald-500",
  },
  {
    label: "Live Combo Chain",
    value: "x12 streak",
    accent: "text-sky-500",
  },
  {
    label: "Bananas Collected",
    value: "3,421",
    accent: "text-amber-500",
  },
];

const LoginPage = ({ onLogin, initialTab = "login", onBack }: LoginPageProps) => {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState<RegisterFormState>(initialRegisterState);
  const [registerErrors, setRegisterErrors] = useState<Record<RegisterField, string>>(initialRegisterErrors);
  const [registerTouched, setRegisterTouched] = useState<Record<RegisterField, boolean>>(initialRegisterTouched);
  const [dialogState, setDialogState] = useState<{ open: boolean; title: string; description: string; tone: DialogTone }>(
    {
      open: false,
      title: "",
      description: "",
      tone: "info",
    },
  );
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (loginMode === "password") {
      setOtpEmail("");
      setOtpCode("");
      setOtpSent(false);
    }
  }, [loginMode]);

  const showDialog = (tone: DialogTone, title: string, description: string) => {
    setDialogState({ open: true, tone, title, description });
  };

  const validateRegisterField = (field: RegisterField, value: string, data: RegisterFormState = registerData): string => {
    const trimmed = value.trim();

    switch (field) {
      case "username":
        if (!trimmed) return "Username is required.";
        if (trimmed.length < 3) return "Username must be at least 3 characters.";
        if (!/^[A-Za-z0-9_]+$/.test(trimmed)) return "Only letters, numbers, and underscores are allowed.";
        return "";
      case "email":
        if (!trimmed) return "Email is required.";
        if (!emailPattern.test(trimmed)) return "Please enter a valid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
          return "Use upper & lower case letters plus a number for strength.";
        }
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== data.password) return "Passwords do not match.";
        return "";
      default:
        return "";
    }
  };

  const composeErrorList = (errors: Record<RegisterField, string>) =>
    Object.values(errors)
      .filter(Boolean)
      .map((message) => `• ${message}`)
      .join("\n");

  const validateRegisterForm = (data: RegisterFormState = registerData) => {
    const evaluatedErrors: Record<RegisterField, string> = {
      username: validateRegisterField("username", data.username, data),
      email: validateRegisterField("email", data.email, data),
      password: validateRegisterField("password", data.password, data),
      confirmPassword: validateRegisterField("confirmPassword", data.confirmPassword, data),
    };

    setRegisterErrors(evaluatedErrors);
    setRegisterTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const hasErrors = Object.values(evaluatedErrors).some(Boolean);

    if (hasErrors) {
      showDialog("error", "Please review your details", composeErrorList(evaluatedErrors));
    }

    return !hasErrors;
  };

  const handleRegisterInputChange = (field: RegisterField, value: string) => {
    setRegisterData((prev) => {
      const updated = { ...prev, [field]: value } as RegisterFormState;
      setRegisterErrors((prevErrors) => {
        const nextErrors = {
          ...prevErrors,
          [field]: validateRegisterField(field, value, updated),
        } as Record<RegisterField, string>;

        if (field === "password" && registerTouched.confirmPassword) {
          nextErrors.confirmPassword = validateRegisterField("confirmPassword", updated.confirmPassword, updated);
        }

        return nextErrors;
      });
      return updated;
    });
  };

  const handleRegisterBlur = (field: RegisterField) => {
    setFocusedField(null);
    setRegisterTouched((prev) => ({ ...prev, [field]: true }));
    setRegisterErrors((prev) => ({
      ...prev,
      [field]: validateRegisterField(field, registerData[field], registerData),
      ...(field === "password"
        ? {
            confirmPassword: validateRegisterField("confirmPassword", registerData.confirmPassword, registerData),
          }
        : {}),
    }));
  };

  const resetRegisterForm = () => {
    setRegisterData(initialRegisterState);
    setRegisterErrors(initialRegisterErrors);
    setRegisterTouched(initialRegisterTouched);
  };

  const registerHasBlockingErrors = Object.values(registerErrors).some(Boolean);
  const isPasswordLoginDisabled = loginLoading || !loginData.username.trim() || !loginData.password.trim();
  const trimmedOtpEmail = otpEmail.trim();
  const isOtpEmailValid = Boolean(trimmedOtpEmail) && emailPattern.test(trimmedOtpEmail);
  const isOtpRequestDisabled = otpRequestLoading || !isOtpEmailValid;
  const isOtpVerifyDisabled = loginLoading || !otpSent || otpCode.length < 6 || !isOtpEmailValid;
  const { gradient, titleClass } = dialogToneStyles[dialogState.tone];
  const DialogIcon = dialogState.tone === "success" ? Sparkles : AlertCircle;

  const handlePasswordLogin = async () => {
    if (loginLoading) return;

    if (!loginData.username || !loginData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/banana/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        toast({
          title: "🎉 Welcome back!",
          description: `Logged in as ${data.username}`,
          className: "bg-gradient-to-r from-green-400 to-green-600 text-white",
        });
        onLogin(data.username);
      } else {
        toast({
          title: "Login failed",
          description: data.detail || "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "Unable to connect to the server. Please check if the backend server is running and try again.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (otpRequestLoading) return;

    if (!isOtpEmailValid) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email before requesting an OTP.",
        variant: "destructive",
      });
      return;
    }

    setOtpSent(false);
    setOtpRequestLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/banana/login/request-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedOtpEmail }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok) {
        setOtpSent(true);
        setOtpCode("");
        toast({
          title: "OTP sent",
          description: `We've sent a one-time code to ${trimmedOtpEmail}.`,
          className: "bg-gradient-to-r from-green-400 to-green-600 text-white",
        });
      } else {
        const detail =
          data?.detail ||
          data?.message ||
          (typeof data === "string" ? data : "Unable to request an OTP. Please try again.");
        toast({
          title: "Request failed",
          description: detail,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP request error:", error);
      toast({
        title: "Request error",
        description: "Unable to reach the server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setOtpRequestLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (loginLoading) return;

    if (!isOtpEmailValid) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (otpCode.length < 6) {
      toast({
        title: "Incomplete OTP",
        description: "Enter the 6-digit code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/banana/login/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedOtpEmail, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok && data?.access && data?.refresh) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        const username = data.username ?? data.user?.username ?? trimmedOtpEmail;
        toast({
          title: "🎉 Welcome back!",
          description: `Logged in via email as ${username}`,
          className: "bg-gradient-to-r from-green-400 to-green-600 text-white",
        });
        setOtpSent(false);
        setOtpCode("");
        onLogin(username);
      } else {
        const detail =
          data?.detail ||
          data?.message ||
          (!data?.access || !data?.refresh ? "Login tokens were not returned by the server." : undefined) ||
          "Invalid or expired OTP. Please request a new code.";
        toast({
          title: "Verification failed",
          description: detail,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMode === "password") {
      await handlePasswordLogin();
      return;
    }

    await handleVerifyOtp();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerLoading) return;

    const isValid = validateRegisterForm();

    if (!isValid) {
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/banana/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          confirm_password: registerData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        resetRegisterForm();
        toast({
          title: "🎉 Account created!",
          description: `Welcome, ${data.username}!`,
          className: "bg-gradient-to-r from-green-400 to-green-600 text-white",
        });
        onLogin(data.username);
      } else {
        const apiError =
          data.detail?.username?.[0] ||
          data.detail?.email?.[0] ||
          data.detail?.password?.[0] ||
          data.detail?.confirm_password?.[0] ||
          data.detail ||
          "Please check your input";

        showDialog("error", "Registration failed", `• ${apiError}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      showDialog(
        "error",
        "Registration error",
        "• Unable to connect to the server. Please check if the backend server is running and try again.",
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff5dc] via-[#ffe3bf] to-[#ffcaa0]">
      {onBack && (
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ x: -4 }}
          className="group absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/30 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur-lg transition-all hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4 text-yellow-500 transition-transform group-hover:-translate-x-1" />
          Back
        </motion.button>
      )}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-gradient-to-br from-yellow-300/40 via-orange-300/30 to-pink-300/30 blur-2xl"
          animate={{ y: [0, -25, 0], rotate: [0, 45, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div
          className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-gradient-to-br from-yellow-400/30 via-orange-400/30 to-red-300/30 blur-3xl"
          animate={{ y: [0, 20, 0], rotate: [0, -60, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-10 h-32 w-32 rounded-full bg-gradient-to-br from-white/30 via-yellow-200/20 to-orange-200/10 blur-2xl"
          animate={{ x: [0, 30, 0], y: [0, -15, 0], rotate: [0, 180, 0] }}
          transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }}
        />
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-yellow-400/40"
            style={{
              left: `${10 + i * 10}%`,
              top: `${15 + (i % 3) * 20}%`,
            }}
            animate={{
              rotate: [0, 180, 360],
              scale: [0.4, 1, 0.4],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 5 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          >
            <Star className="h-4 w-4" />
          </motion.div>
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute text-yellow-500/40"
            style={{
              left: `${20 + (i % 5) * 14}%`,
              top: `${10 + (i % 2) * 25}%`,
            }}
            animate={{
              rotate: [0, 120, 240, 360],
              scale: [0.3, 0.9, 0.3],
              opacity: [0.3, 0.9, 0.3],
            }}
            transition={{
              duration: 3.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-3 w-3" />
          </motion.div>
        ))}
      </div>
      <Particles
        id="tsparticles"
        url="https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js"
        options={{
          particles: {
            number: { value: 40 },
            shape: { type: "circle" },
            size: { value: { min: 6, max: 12 } },
            move: { enable: true, speed: 1.6 },
            opacity: { value: 0.4 },
          },
        }}
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_60%)]" />
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={`banana-trail-${index}`}
          className="pointer-events-none absolute text-4xl drop-shadow-lg"
          style={{
            left: `${5 + index * 16}%`,
            top: `${20 + ((index + 1) % 4) * 15}%`,
          }}
          animate={{
            y: [0, -12, 0],
            rotate: index % 2 === 0 ? [0, 10, -10, 0] : [0, -8, 8, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
        >
          🍌
        </motion.div>
      ))}
      <div className="relative z-10 w-full px-4 py-16 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16"
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="order-2 flex flex-col gap-10 lg:order-1"
          >
            <div className="relative overflow-hidden rounded-[32px] border border-white/30 bg-white/10 p-[1px] shadow-[0_45px_100px_-60px_rgba(234,179,8,0.85)] backdrop-blur-2xl">
              <div className="relative h-full w-full rounded-[30px] bg-gradient-to-br from-yellow-500/25 via-orange-400/20 to-pink-400/25 px-8 py-12 text-white">
                <motion.div
                  className="absolute -top-40 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-yellow-400/50 via-orange-400/40 to-pink-400/30 blur-3xl"
                  animate={{ rotate: [0, 45, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-gradient-to-br from-white/20 via-yellow-200/30 to-orange-200/20 blur-3xl"
                  animate={{ rotate: [0, -60, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
                <Badge className="mb-6 w-fit rounded-full border border-white/30 bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/90 shadow-sm backdrop-blur-sm">
                  Banana Blitz
                </Badge>
                <h2 className="text-4xl font-extrabold leading-tight drop-shadow-sm sm:text-5xl">Unlock your banana superpowers</h2>
                <p className="mt-4 max-w-md text-base text-white/80">
                  Build your reflexes, sync your progress, and climb the leaderboard in a whimsical arcade sprint built for the University of Bahrain.
                </p>
                <div className="mt-10 grid gap-6">
                  {featureHighlights.map(({ icon: Icon, title, description, gradient: itemGradient }) => (
                    <motion.div
                      key={title}
                      whileHover={{ translateY: -4, scale: 1.01 }}
                      className="flex items-start gap-4 rounded-2xl border border-white/25 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-lg"
                    >
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${itemGradient} text-white shadow-lg shadow-black/10`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold tracking-tight drop-shadow-sm">{title}</h3>
                        <p className="text-sm text-white/80">{description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: "easeOut" }}
              className="relative grid gap-4 rounded-3xl border border-white/50 bg-white/50 p-6 shadow-[0_25px_60px_-35px_rgba(59,130,246,0.45)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  <Gamepad2 className="h-4 w-4 text-indigo-500" />
                  Live Lobby
                </span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-500"
                >
                  <Sparkles className="h-3 w-3" /> Active players: 128
                </motion.span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {scoreboardTeasers.map(({ label, value, accent }) => (
                  <motion.div
                    key={label}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="rounded-2xl border border-white/60 bg-white/60 p-4 text-center shadow-inner shadow-white/40"
                  >
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className={`mt-2 text-lg font-black ${accent}`}>{value}</p>
                  </motion.div>
                ))}
              </div>
              <motion.span
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600"
              >
                <Trophy className="h-3 w-3 text-amber-500" />
                Puzzle feed refreshes every 60 seconds
              </motion.span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.8, ease: "easeOut" }}
            className="order-1 lg:order-2"
          >
            <Card className="relative mx-auto w-full max-w-lg overflow-hidden border border-white/50 bg-white/85 shadow-[0_45px_120px_-60px_rgba(249,115,22,0.75)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-white/90" />
              <motion.div
                className="absolute -top-32 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-yellow-400/40 via-orange-400/20 to-red-400/30 blur-3xl"
                animate={{ rotate: [0, 360], scale: [1, 1.15, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative p-8 sm:p-10">
                <div className="mb-8 flex flex-col items-center text-center">
                  <Badge className="mb-4 rounded-full border border-yellow-300/80 bg-yellow-100/90 px-5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-yellow-700 shadow-sm">
                    Verified Banana Feed
                  </Badge>
                  <motion.div
                    className="text-7xl sm:text-8xl"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2.4 }}
                  >
                    🍌
                  </motion.div>
                  <h1 className="mt-4 text-3xl font-black text-gray-900 sm:text-4xl">Banana Brain Puzzle Hub</h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Sync your account to submit solutions from the official University of Bahrain Banana API feed.
                  </p>
                </div>
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "login" | "register")}
                  className="space-y-8"
                >
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-gradient-to-r from-yellow-100 via-white to-yellow-100 p-1 shadow-inner shadow-yellow-500/20">
                    <TabsTrigger
                      value="login"
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition-all duration-200 data-[state=active]:translate-y-[-2px] data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-400/30"
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-gray-500 transition-all duration-200 data-[state=active]:translate-y-[-2px] data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg data-[state=active]:shadow-orange-400/30"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </TabsTrigger>
                  </TabsList>
                  <AnimatePresence mode="wait">
                    <TabsContent value="login" asChild>
                      <motion.form
                        onSubmit={handleLoginSubmit}
                        className="space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="grid grid-cols-1 gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/70 p-2 sm:grid-cols-2"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Button
                            type="button"
                            onClick={() => setLoginMode("password")}
                            variant="ghost"
                            className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                              loginMode === "password"
                                ? "bg-white text-gray-900 shadow-md shadow-yellow-200"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <KeyRound className="h-4 w-4 text-yellow-500" />
                              Password Login
                            </span>
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setLoginMode("otp")}
                            variant="ghost"
                            className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                              loginMode === "otp"
                                ? "bg-white text-gray-900 shadow-md shadow-yellow-200"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Mail className="h-4 w-4 text-yellow-500" />
                              Email OTP Login
                            </span>
                          </Button>
                        </motion.div>

                        {loginMode === "password" ? (
                          <>
                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <label htmlFor="login-username" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="h-4 w-4 text-yellow-500" />
                                Username
                              </label>
                              <motion.div
                                className="relative"
                                animate={{
                                  boxShadow: focusedField === "login-username" ? "0 0 20px rgba(251,191,36,0.35)" : "0 0 0 rgba(0,0,0,0)",
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <Input
                                  id="login-username"
                                  type="text"
                                  placeholder="Enter username"
                                  value={loginData.username}
                                  onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                                  onFocus={() => setFocusedField("login-username")}
                                  onBlur={() => setFocusedField(null)}
                                  className="h-12 rounded-2xl border-2 border-yellow-300/70 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 hover:border-yellow-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-200/60"
                                />
                                <motion.div
                                  className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-yellow-400"
                                  animate={{ x: loginData.username ? [0, 2, 0] : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <User className="h-4 w-4" />
                                </motion.div>
                              </motion.div>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <label htmlFor="login-password" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <KeyRound className="h-4 w-4 text-yellow-500" />
                                Password
                              </label>
                              <motion.div
                                className="relative"
                                animate={{
                                  boxShadow: focusedField === "login-password" ? "0 0 20px rgba(251,191,36,0.35)" : "0 0 0 rgba(0,0,0,0)",
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <Input
                                  id="login-password"
                                  type="password"
                                  placeholder="••••••••"
                                  value={loginData.password}
                                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                                  onFocus={() => setFocusedField("login-password")}
                                  onBlur={() => setFocusedField(null)}
                                  className="h-12 rounded-2xl border-2 border-yellow-300/70 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 hover:border-yellow-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-200/60"
                                />
                                <motion.div
                                  className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-yellow-400"
                                  animate={{ x: loginData.password ? [0, 2, 0] : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </motion.div>
                              </motion.div>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: isPasswordLoginDisabled ? 1 : 1.02 }}
                              whileTap={{ scale: isPasswordLoginDisabled ? 1 : 0.98 }}
                              animate={{
                                background: loginLoading
                                  ? [
                                      "linear-gradient(90deg, rgba(251,191,36,1) 0%, rgba(249,115,22,1) 50%, rgba(251,191,36,1) 100%)",
                                      "linear-gradient(90deg, rgba(249,115,22,1) 0%, rgba(251,191,36,1) 50%, rgba(249,115,22,1) 100%)",
                                    ]
                                  : "linear-gradient(90deg, rgba(251,191,36,1), rgba(249,115,22,1))",
                              }}
                              transition={{ duration: 2, repeat: loginLoading ? Infinity : 0 }}
                            >
                              <Button
                                type="submit"
                                disabled={isPasswordLoginDisabled}
                                className="h-12 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 text-base font-semibold text-white shadow-lg shadow-orange-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {loginLoading ? (
                                  <motion.span
                                    className="flex items-center justify-center gap-2"
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                  >
                                    <Zap className="h-5 w-5" />
                                    Loading…
                                  </motion.span>
                                ) : (
                                  <span className="flex items-center justify-center gap-2">Login &amp; Play</span>
                                )}
                              </Button>
                            </motion.div>
                          </>
                        ) : (
                          <>
                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <label htmlFor="login-otp-email" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Mail className="h-4 w-4 text-yellow-500" />
                                University Email
                              </label>
                              <motion.div
                                className="relative"
                                animate={{
                                  boxShadow: focusedField === "login-otp-email" ? "0 0 20px rgba(251,191,36,0.35)" : "0 0 0 rgba(0,0,0,0)",
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <Input
                                  id="login-otp-email"
                                  type="email"
                                  placeholder="you@example.com"
                                  value={otpEmail}
                                  onChange={(e) => {
                                    setOtpEmail(e.target.value);
                                    setOtpSent(false);
                                    setOtpCode("");
                                  }}
                                  onFocus={() => setFocusedField("login-otp-email")}
                                  onBlur={() => setFocusedField(null)}
                                  className={`h-12 rounded-2xl border-2 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 ${
                                    otpEmail && !isOtpEmailValid
                                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200/60"
                                      : "border-yellow-300/70 hover:border-yellow-400 focus:border-orange-400 focus:ring-orange-200/60"
                                  }`}
                                />
                                <motion.div
                                  className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                                  animate={{
                                    x: otpEmail ? [0, 2, 0] : 0,
                                    color: otpEmail && !isOtpEmailValid ? "#f43f5e" : "#f59e0b",
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Mail className="h-4 w-4" />
                                </motion.div>
                              </motion.div>
                              {otpEmail && !isOtpEmailValid && (
                                <motion.p
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-500"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Enter a valid email address to receive your OTP.
                                </motion.p>
                              )}
                            </motion.div>

                            <motion.div
                              className="flex flex-col gap-4 rounded-2xl border border-yellow-200/60 bg-yellow-50/80 p-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div
                                whileHover={{ scale: isOtpRequestDisabled ? 1 : 1.01 }}
                                whileTap={{ scale: isOtpRequestDisabled ? 1 : 0.99 }}
                              >
                                <Button
                                  type="button"
                                  onClick={handleRequestOtp}
                                  disabled={isOtpRequestDisabled}
                                  className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 text-sm font-semibold text-white shadow-lg shadow-orange-300/40 transition-all hover:shadow-xl hover:shadow-orange-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {otpRequestLoading ? (
                                    <motion.span
                                      className="flex items-center justify-center gap-2"
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    >
                                      <Zap className="h-5 w-5" />
                                      Sending…
                                    </motion.span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-2">Request OTP</span>
                                  )}
                                </Button>
                              </motion.div>

                              <div className="space-y-3">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <InputOTP
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(value) => setOtpCode(value.replace(/\D/g, ""))}
                                    containerClassName="justify-center"
                                  >
                                    <InputOTPGroup className="gap-2">
                                      {Array.from({ length: 6 }).map((_, index) => (
                                        <InputOTPSlot
                                          key={index}
                                          index={index}
                                          className="flex h-12 w-10 items-center justify-center rounded-xl border-2 border-yellow-200 bg-white/90 text-lg font-semibold text-gray-700 shadow-inner transition-all duration-200 data-[active=true]:border-orange-400 data-[filled=true]:border-orange-400"
                                        />
                                      ))}
                                    </InputOTPGroup>
                                  </InputOTP>
                                  <p className="text-xs font-medium text-gray-500">Enter the 6-digit code sent to your email.</p>
                                </div>
                                {otpSent && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    OTP sent to <span className="font-bold">{trimmedOtpEmail}</span>. Check your inbox and spam folder.
                                  </motion.p>
                                )}
                              </div>

                              <motion.div
                                whileHover={{ scale: isOtpVerifyDisabled ? 1 : 1.02 }}
                                whileTap={{ scale: isOtpVerifyDisabled ? 1 : 0.98 }}
                                animate={{
                                  background: loginLoading
                                    ? [
                                        "linear-gradient(90deg, rgba(251,191,36,1) 0%, rgba(249,115,22,1) 50%, rgba(251,191,36,1) 100%)",
                                        "linear-gradient(90deg, rgba(249,115,22,1) 0%, rgba(251,191,36,1) 50%, rgba(249,115,22,1) 100%)",
                                      ]
                                    : "linear-gradient(90deg, rgba(251,191,36,1), rgba(249,115,22,1))",
                                }}
                                transition={{ duration: 2, repeat: loginLoading ? Infinity : 0 }}
                              >
                                <Button
                                  type="submit"
                                  disabled={isOtpVerifyDisabled}
                                  className="h-11 w-full rounded-xl bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 text-sm font-semibold text-white shadow-lg shadow-orange-300/40 transition-all hover:shadow-xl hover:shadow-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {loginLoading ? (
                                    <motion.span
                                      className="flex items-center justify-center gap-2"
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    >
                                      <Zap className="h-5 w-5" />
                                      Verifying…
                                    </motion.span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-2">Verify &amp; Login</span>
                                  )}
                                </Button>
                              </motion.div>
                            </motion.div>
                          </>
                        )}
                      </motion.form>
                    </TabsContent>
                    <TabsContent value="register" asChild>
                      <motion.form
                        onSubmit={handleRegister}
                        className="space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <label htmlFor="register-username" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <User className="h-4 w-4 text-yellow-500" />
                            Username
                          </label>
                          <motion.div
                            className="relative"
                            animate={{
                              boxShadow: focusedField === "register-username" ? "0 0 20px rgba(249,115,22,0.35)" : "0 0 0 rgba(0,0,0,0)",
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <Input
                              id="register-username"
                              type="text"
                              placeholder="Choose a username"
                              value={registerData.username}
                              onChange={(e) => handleRegisterInputChange("username", e.target.value)}
                              onFocus={() => setFocusedField("register-username")}
                              onBlur={() => handleRegisterBlur("username")}
                              aria-invalid={registerTouched.username && Boolean(registerErrors.username)}
                              className={`h-12 rounded-2xl border-2 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 ${
                                registerTouched.username && registerErrors.username
                                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200/60"
                                  : "border-yellow-300/80 hover:border-orange-300 focus:border-orange-400 focus:ring-orange-200/70"
                              }`}
                            />
                            <motion.div
                              className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                              animate={{
                                x: registerData.username ? [0, 2, 0] : 0,
                                color: registerTouched.username && registerErrors.username ? "#f43f5e" : "#f59e0b",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <User className="h-4 w-4" />
                            </motion.div>
                          </motion.div>
                          {registerTouched.username && registerErrors.username && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-500"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              {registerErrors.username}
                            </motion.p>
                          )}
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <label htmlFor="register-email" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Mail className="h-4 w-4 text-yellow-500" />
                            Email
                          </label>
                          <motion.div
                            className="relative"
                            animate={{
                              boxShadow: focusedField === "register-email" ? "0 0 20px rgba(249,115,22,0.35)" : "0 0 0 rgba(0,0,0,0)",
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <Input
                              id="register-email"
                              type="email"
                              placeholder="you@example.com"
                              value={registerData.email}
                              onChange={(e) => handleRegisterInputChange("email", e.target.value)}
                              onFocus={() => setFocusedField("register-email")}
                              onBlur={() => handleRegisterBlur("email")}
                              aria-invalid={registerTouched.email && Boolean(registerErrors.email)}
                              className={`h-12 rounded-2xl border-2 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 ${
                                registerTouched.email && registerErrors.email
                                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200/60"
                                  : "border-yellow-300/80 hover:border-orange-300 focus:border-orange-400 focus:ring-orange-200/70"
                              }`}
                            />
                            <motion.div
                              className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                              animate={{
                                x: registerData.email ? [0, 2, 0] : 0,
                                color: registerTouched.email && registerErrors.email ? "#f43f5e" : "#f59e0b",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Mail className="h-4 w-4" />
                            </motion.div>
                          </motion.div>
                          {registerTouched.email && registerErrors.email && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-500"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              {registerErrors.email}
                            </motion.p>
                          )}
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <label htmlFor="register-password" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <KeyRound className="h-4 w-4 text-yellow-500" />
                            Password
                          </label>
                          <motion.div
                            className="relative"
                            animate={{
                              boxShadow: focusedField === "register-password" ? "0 0 20px rgba(249,115,22,0.35)" : "0 0 0 rgba(0,0,0,0)",
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <Input
                              id="register-password"
                              type="password"
                              placeholder="Create a strong password"
                              value={registerData.password}
                              onChange={(e) => handleRegisterInputChange("password", e.target.value)}
                              onFocus={() => setFocusedField("register-password")}
                              onBlur={() => handleRegisterBlur("password")}
                              aria-invalid={registerTouched.password && Boolean(registerErrors.password)}
                              className={`h-12 rounded-2xl border-2 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 ${
                                registerTouched.password && registerErrors.password
                                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200/60"
                                  : "border-yellow-300/80 hover:border-orange-300 focus:border-orange-400 focus:ring-orange-200/70"
                              }`}
                            />
                            <motion.div
                              className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                              animate={{
                                x: registerData.password ? [0, 2, 0] : 0,
                                color: registerTouched.password && registerErrors.password ? "#f43f5e" : "#f59e0b",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </motion.div>
                          </motion.div>
                          {registerTouched.password && registerErrors.password && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-500"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              {registerErrors.password}
                            </motion.p>
                          )}
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                          <label htmlFor="register-confirm-password" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <ShieldCheck className="h-4 w-4 text-yellow-500" />
                            Confirm Password
                          </label>
                          <motion.div
                            className="relative"
                            animate={{
                              boxShadow: focusedField === "register-confirm-password" ? "0 0 20px rgba(249,115,22,0.35)" : "0 0 0 rgba(0,0,0,0)",
                            }}
                            transition={{ duration: 0.3 }}
                          >
                            <Input
                              id="register-confirm-password"
                              type="password"
                              placeholder="Repeat your password"
                              value={registerData.confirmPassword}
                              onChange={(e) => handleRegisterInputChange("confirmPassword", e.target.value)}
                              onFocus={() => setFocusedField("register-confirm-password")}
                              onBlur={() => handleRegisterBlur("confirmPassword")}
                              aria-invalid={registerTouched.confirmPassword && Boolean(registerErrors.confirmPassword)}
                              className={`h-12 rounded-2xl border-2 bg-white/85 pl-12 pr-4 text-base font-medium text-gray-700 shadow-inner transition-all duration-300 ${
                                registerTouched.confirmPassword && registerErrors.confirmPassword
                                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200/60"
                                  : "border-yellow-300/80 hover:border-orange-300 focus:border-orange-400 focus:ring-orange-200/70"
                              }`}
                            />
                            <motion.div
                              className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                              animate={{
                                x: registerData.confirmPassword ? [0, 2, 0] : 0,
                                color: registerTouched.confirmPassword && registerErrors.confirmPassword ? "#f43f5e" : "#f59e0b",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </motion.div>
                          </motion.div>
                          {registerTouched.confirmPassword && registerErrors.confirmPassword && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 flex items-center gap-2 text-xs font-medium text-rose-500"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              {registerErrors.confirmPassword}
                            </motion.p>
                          )}
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: registerLoading || registerHasBlockingErrors ? 1 : 1.02 }}
                          whileTap={{ scale: registerLoading || registerHasBlockingErrors ? 1 : 0.98 }}
                          animate={{
                            background: registerLoading
                              ? [
                                  "linear-gradient(90deg, rgba(249,115,22,1) 0%, rgba(236,72,153,1) 50%, rgba(249,115,22,1) 100%)",
                                  "linear-gradient(90deg, rgba(236,72,153,1) 0%, rgba(249,115,22,1) 50%, rgba(236,72,153,1) 100%)",
                                ]
                              : "linear-gradient(90deg, rgba(249,115,22,1), rgba(236,72,153,1))",
                          }}
                          transition={{ duration: 2, repeat: registerLoading ? Infinity : 0 }}
                        >
                          <Button
                            type="submit"
                            disabled={registerLoading || registerHasBlockingErrors}
                            className="h-12 w-full rounded-2xl bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 text-base font-semibold text-white shadow-lg shadow-orange-400/40 transition-all duration-300 hover:shadow-xl hover:shadow-rose-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {registerLoading ? (
                              <motion.span
                                className="flex items-center justify-center gap-2"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                              >
                                <Zap className="h-5 w-5" />
                                Creating…
                              </motion.span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">Create Account &amp; Play</span>
                            )}
                          </Button>
                        </motion.div>
                      </motion.form>
                    </TabsContent>
                  </AnimatePresence>
                </Tabs>
                <motion.div
                  className="mt-6 space-y-2 text-center text-xs text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <p className="flex items-center justify-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Secure authentication with JWT
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Gamepad2 className="h-3.5 w-3.5 text-indigo-500" />
                    Event-driven gameplay with instant feedback
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    Powered by the Banana API leaderboard
                  </p>
                  <p className="text-[0.65rem] text-gray-500">Backend endpoint: {apiBaseUrl}</p>
                  <p className="text-[0.65rem] text-gray-500">Puzzle feed: {puzzleApiUrl}</p>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
      <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="border-none bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader className="space-y-4">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-orange-200/40`}>
              <DialogIcon className="h-7 w-7" />
            </div>
            <AlertDialogTitle className={`text-center text-2xl font-bold ${titleClass}`}>{dialogState.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-center text-sm text-gray-600">
              {dialogState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDialogState((prev) => ({ ...prev, open: false }))}
              className={`w-full justify-center rounded-xl bg-gradient-to-r ${gradient} px-6 py-2 font-semibold text-white shadow-lg shadow-orange-200/40 hover:shadow-xl`}
            >
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoginPage;
