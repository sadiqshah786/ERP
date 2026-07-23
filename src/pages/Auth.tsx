import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Mail, Lock, User as UserIcon, Briefcase, Eye, EyeOff, ArrowRight, Loader2, RefreshCw, Check,
  TrendingUp, FileText, BookOpen, Package, ShoppingCart, Users, DollarSign, Layers, Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { FieldError } from "@/components/ui/field-error";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { Logo } from "@/components/Logo";
import { brand, countryCodes } from "@/lib/brand";
import { FIREBASE_CONFIGURED } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type View = "signin" | "signup" | "verify" | "forgot";

function Field({
  icon: Icon, label, right, error, children, className,
}: { icon?: React.ElementType; label: string; right?: React.ReactNode; error?: unknown; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {right}
      </div>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />}
        {children}
      </div>
      <FieldError error={error} />
    </div>
  );
}

const inputCls = (hasIcon = true) =>
  cn(
    "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
    hasIcon ? "pl-10 pr-4" : "px-4"
  );

const signinSchema = Yup.object({
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});
const forgotSchema = Yup.object({
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
});
const signupSchema = Yup.object({
  name: Yup.string().required("Full name is required"),
  company: Yup.string().required("Company name is required"),
  email: Yup.string().email("Enter a valid email address").required("Email is required"),
  phone: Yup.string().required("WhatsApp number is required").matches(/^[0-9\s-]{6,}$/, "Enter a valid number"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Auth({ initial = "signin" }: { initial?: View }) {
  const { user, loading, signIn, signUp, resendVerification, checkVerified, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [view, setView] = useState<View>(initial);
  const [showPwd, setShowPwd] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [resetSentTo, setResetSentTo] = useState("");

  const doReset = async (values: { email: string }) => {
    try {
      await resetPassword(values.email);
      setResetSentTo(values.email);
    } catch (err: any) {
      toast({ title: "Could not send reset link", description: friendly(err), type: "error" });
    }
  };

  const doSignIn = async (values: { email: string; password: string }) => {
    try {
      await signIn(values.email, values.password);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Sign in failed", description: friendly(err), type: "error" });
    }
  };

  const doSignUp = async (values: { name: string; company: string; email: string; dial: string; phone: string; password: string }) => {
    try {
      await signUp(values.email, values.password, { name: values.name, company: values.company, whatsapp: `${values.dial} ${values.phone}` });
      setVerifyEmail(values.email);
      setView("verify");
    } catch (err: any) {
      toast({ title: "Could not create account", description: friendly(err), type: "error" });
    }
  };

  // ── Verification polling (step 2) ──────────────────────────
  const [cooldown, setCooldown] = useState(45);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (view !== "verify") return;
    setCooldown(45);
    const tick = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    pollRef.current = setInterval(async () => {
      const ok = await checkVerified();
      if (ok) {
        clearInterval(pollRef.current);
        toast({ title: "Email verified 🎉", description: "Welcome aboard!", type: "success" });
        navigate("/");
      }
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const resend = async () => {
    await resendVerification();
    setCooldown(45);
    toast({ title: "Verification email re-sent", type: "info" });
  };

  // If already signed in & verified, bounce to app.
  useEffect(() => {
    if (user?.emailVerified && view !== "verify") navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // While the initial auth state resolves, show the loader (avoids a
  // flash of the login form before a signed-in user is redirected).
  if (loading) return <FullScreenLoader />;

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#1a1118] p-4">
      {/* Animated aurora background */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#f97316]/40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[36rem] w-[36rem] rounded-full bg-secondary/30 blur-3xl animate-blob [animation-delay:4s]" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-80 w-80 rounded-full bg-[#ec4899]/25 blur-3xl animate-blob [animation-delay:8s]" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/15 bg-white shadow-2xl animate-fade-in lg:grid-cols-2">
        <ShowcasePanel view={view} />

        {/* Form column */}
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:order-first">
          <div className="mb-6 lg:hidden"><Logo variant="color" size={40} /></div>
          {(view === "signup" || view === "verify") && <AuthStepper step={view === "verify" ? 2 : 1} />}

          <div className="flex flex-col">
            {view === "signin" && (
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-gray-900">Welcome Back</h1>
                  <p className="mt-1 text-sm text-gray-500">Sign in to manage your business</p>
                </div>

                <Formik initialValues={{ email: "", password: "" }} validationSchema={signinSchema} onSubmit={doSignIn}>
                  {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                    <Form className="mt-8 space-y-5">
                      <Field icon={Mail} label="Email Address" error={touched.email && errors.email}>
                        <input name="email" className={cn(inputCls(), touched.email && errors.email && "border-destructive")} type="email" placeholder="you@company.com" value={values.email} onChange={handleChange} onBlur={handleBlur} />
                      </Field>
                      <Field icon={Lock} label="Password" error={touched.password && errors.password}
                        right={<button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => { setResetSentTo(""); setView("forgot"); }}>Forgot?</button>}>
                        <input name="password" className={cn(inputCls(), "pr-11", touched.password && errors.password && "border-destructive")} type={showPwd ? "text" : "password"} placeholder="Enter your password" value={values.password} onChange={handleChange} onBlur={handleBlur} />
                        <PwdToggle on={showPwd} set={setShowPwd} />
                      </Field>
                      <SubmitButton busy={isSubmitting}>Sign In <ArrowRight className="h-4 w-4" /></SubmitButton>
                    </Form>
                  )}
                </Formik>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button className="font-bold text-primary hover:underline" onClick={() => setView("signup")}>Create Account</button>
                </p>
                {!FIREBASE_CONFIGURED && <DemoNote />}
                <p className="mt-8 text-center text-xs text-gray-400">Powered by {brand.shortName}</p>
              </>
            )}

            {view === "forgot" && (
              <>
                <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-gray-900">Reset Password</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {resetSentTo ? "Check your inbox for the reset link." : "Enter your email and we'll send you a reset link."}
                  </p>
                </div>

                {resetSentTo ? (
                  <div className="mt-7 space-y-5 text-center">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success/10">
                      <Mail className="h-9 w-9 text-success" />
                    </div>
                    <p className="text-sm text-gray-600">
                      We've sent a password reset link to<br /><span className="font-bold text-primary">{resetSentTo}</span>
                    </p>
                    <SubmitButton busy={false} onClick={() => setView("signin")}>Back to Sign In</SubmitButton>
                  </div>
                ) : (
                  <Formik initialValues={{ email: "" }} validationSchema={forgotSchema} onSubmit={doReset}>
                    {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
                      <Form className="mt-7 space-y-5">
                        <Field icon={Mail} label="Email Address" error={touched.email && errors.email}>
                          <input name="email" className={cn(inputCls(), touched.email && errors.email && "border-destructive")} type="email" placeholder="you@company.com" value={values.email} onChange={handleChange} onBlur={handleBlur} />
                        </Field>
                        <SubmitButton busy={isSubmitting}>Send Reset Link <ArrowRight className="h-4 w-4" /></SubmitButton>
                      </Form>
                    )}
                  </Formik>
                )}

                <p className="mt-6 text-center text-sm text-gray-600">
                  Remembered it?{" "}
                  <button className="font-bold text-primary hover:underline" onClick={() => setView("signin")}>Sign In</button>
                </p>
              </>
            )}

            {view === "signup" && (
              <>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-gray-900">Create Your Account</h1>
                  <p className="mt-1 text-sm text-gray-500">Step 1 of 2 — Account Details</p>
                </div>

                <Formik
                  initialValues={{ name: "", company: "", email: "", dial: "+92", phone: "", password: "" }}
                  validationSchema={signupSchema} onSubmit={doSignUp}
                >
                  {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
                    <Form className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field icon={UserIcon} label="Full Name" error={touched.name && errors.name}>
                        <input name="name" className={cn(inputCls(), touched.name && errors.name && "border-destructive")} placeholder="Your name" value={values.name} onChange={handleChange} onBlur={handleBlur} />
                      </Field>
                      <Field icon={Briefcase} label="Company Name" error={touched.company && errors.company}>
                        <input name="company" className={cn(inputCls(), touched.company && errors.company && "border-destructive")} placeholder="Your company" value={values.company} onChange={handleChange} onBlur={handleBlur} />
                      </Field>
                      <Field icon={Mail} label="Email Address" error={touched.email && errors.email} className="sm:col-span-2">
                        <input name="email" className={cn(inputCls(), touched.email && errors.email && "border-destructive")} type="email" placeholder="you@company.com" value={values.email} onChange={handleChange} onBlur={handleBlur} />
                      </Field>
                      <Field label="WhatsApp Number" error={touched.phone && errors.phone} className="sm:col-span-2">
                        <div className="flex gap-2">
                          <select className="h-11 w-32 shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-2 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white"
                            value={values.dial} onChange={(e) => setFieldValue("dial", e.target.value)}>
                            {countryCodes.map((c) => <option key={c.iso} value={c.code}>{c.iso} {c.code} {c.name}</option>)}
                          </select>
                          <input name="phone" className={cn(inputCls(false), touched.phone && errors.phone && "border-destructive")} placeholder="3001234567" value={values.phone} onChange={handleChange} onBlur={handleBlur} />
                        </div>
                      </Field>
                      <Field icon={Lock} label="Password" error={touched.password && errors.password} className="sm:col-span-2">
                        <input name="password" className={cn(inputCls(), "pr-11", touched.password && errors.password && "border-destructive")} type={showPwd ? "text" : "password"} placeholder="Create a password" value={values.password} onChange={handleChange} onBlur={handleBlur} />
                        <PwdToggle on={showPwd} set={setShowPwd} />
                      </Field>
                      <div className="sm:col-span-2">
                        <SubmitButton busy={isSubmitting}>Create Account <ArrowRight className="h-4 w-4" /></SubmitButton>
                      </div>
                    </Form>
                  )}
                </Formik>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button className="font-bold text-primary hover:underline" onClick={() => setView("signin")}>Sign In</button>
                </p>
              </>
            )}

            {view === "verify" && (
              <div className="text-center">
                <h1 className="text-2xl font-black text-gray-900">Email Verification</h1>
                <p className="mt-1 text-sm text-gray-500">Step 2 of 2</p>

                <div className="mx-auto mt-8 grid h-24 w-24 place-items-center rounded-full bg-primary/10">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <h2 className="mt-6 text-2xl font-black text-gray-900">Verify Your Email</h2>
                <p className="mt-2 text-gray-500">We've sent a verification link to</p>
                <p className="font-bold text-primary">{verifyEmail || user?.email}</p>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                  Click the link in your email to verify your account. This page will automatically proceed once verified.
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Waiting for verification…</span>
                </div>

                <button
                  onClick={resend}
                  disabled={cooldown > 0}
                  className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Email"}
                </button>

                {!FIREBASE_CONFIGURED && (
                  <p className="mt-4 text-xs text-gray-400">Demo mode auto-verifies in a moment…</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-0 right-0 z-10 text-center text-xs text-white/40">
        {brand.fullName} — {brand.tagline}
      </p>
    </div>
  );
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  Accounting: BookOpen, Inventory: Package, "Point of Sale": ShoppingCart, Invoicing: FileText,
  "HR & Payroll": Users, Finance: DollarSign, Reports: TrendingUp, "Multi-Branch": Layers,
};

function ShowcasePanel({ view }: { view: View }) {
  const isSignup = view === "signup" || view === "verify";
  const statCards = [
    { icon: TrendingUp, label: "Today's Sales", value: "Rs 1.24M", badge: "+12%" },
    { icon: FileText, label: "Invoices this month", value: "1,284", badge: "+8%" },
  ];

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden p-10 text-white hero-mesh lg:flex">
      {/* floating glows */}
      <div className="pointer-events-none absolute -right-10 top-8 h-44 w-44 rounded-full bg-white/10 blur-2xl animate-blob" />
      <div className="pointer-events-none absolute -left-8 bottom-12 h-52 w-52 rounded-full bg-secondary/30 blur-3xl animate-blob [animation-delay:5s]" />

      <div className="relative z-10 flex flex-col gap-4">
        <Logo variant="light" size={44} />
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" /> Cloud ERP · Accounting · Inventory · POS
        </span>
      </div>

      {isSignup ? (
        /* SIGNUP — "what we provide" modules showcase */
        <div className="relative z-10">
          <p className="text-sm text-white/70">Complete Business Management</p>
          <h2 className="mt-1 text-3xl font-extrabold leading-tight">
            Accounting <span className="bg-gradient-to-r from-white to-[#fed7aa] bg-clip-text text-transparent">&amp; ERP</span> Software
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{brand.description}</p>

          <p className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-white/50">Everything you need in one place</p>
          <div className="flex flex-wrap gap-2.5">
            {brand.modules.map((m) => {
              const Icon = MODULE_ICONS[m] ?? Layers;
              return (
                <span key={m} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90 ring-1 ring-white/15 transition-colors hover:bg-white/15">
                  <Icon className="h-4 w-4" /> {m}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        /* LOGIN — animated hero with floating stat cards */
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold leading-[1.1]">
            Run your business,<br />
            <span className="bg-gradient-to-r from-white to-[#fed7aa] bg-clip-text text-transparent">beautifully.</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{brand.description}</p>
          <div className="mt-7 space-y-3">
            {statCards.map((s, i) => (
              <div key={s.label}
                className={cn("flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md animate-float", i === 1 && "ml-10 [animation-delay:1.4s]")}>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15"><s.icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-white/60">{s.label}</div>
                  <div className="text-lg font-extrabold">{s.value}</div>
                </div>
                <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-xs font-bold text-[#eaffd0]">{s.badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 flex gap-8 border-t border-white/15 pt-5">
        {brand.stats.map((s) => (
          <div key={s.label}>
            <div className="text-xl font-extrabold">{s.value}</div>
            <div className="text-[11px] uppercase tracking-wide text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthStepper({ step }: { step: 1 | 2 }) {
  const steps = [{ n: 1, label: "Account Details" }, { n: 2, label: "Verification" }];
  return (
    <div className="mb-6 flex items-center justify-center">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition-colors",
                done ? "bg-secondary text-white" : active ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
              )}>
                {done ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span className={cn("hidden text-sm font-semibold sm:inline", active || done ? "text-gray-900" : "text-gray-400")}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={cn("mx-3 h-0.5 w-10 rounded", step > s.n ? "bg-secondary" : "bg-gray-200")} />}
          </div>
        );
      })}
    </div>
  );
}

function PwdToggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => set(!on)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {on ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function SubmitButton({ busy, children, onClick }: { busy: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={busy}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#db2777] text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:opacity-95 disabled:opacity-70"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  );
}

function DemoNote() {
  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
      <strong>Demo mode.</strong> Firebase isn't configured — any email/password works and data is stored locally.
      Add your keys to <code>.env</code> to enable real Auth &amp; email verification.
    </div>
  );
}

function friendly(err: any): string {
  const code = err?.code || "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
  };
  return map[code] || err?.message || "Please try again.";
}
