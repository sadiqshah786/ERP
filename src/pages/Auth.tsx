import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, User as UserIcon, Briefcase, Eye, EyeOff, ArrowRight, Loader2, RefreshCw,
} from "lucide-react";
import { useAuth, SignupProfile } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { LoginBrandPanel, SignupBrandPanel } from "@/components/auth/BrandPanel";
import { Logo } from "@/components/Logo";
import { brand, countryCodes } from "@/lib/brand";
import { FIREBASE_CONFIGURED } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type View = "signin" | "signup" | "verify";

function Field({
  icon: Icon, label, right, children,
}: { icon?: React.ElementType; label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-800">{label}</label>
        {right}
      </div>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />}
        {children}
      </div>
    </div>
  );
}

const inputCls = (hasIcon = true) =>
  cn(
    "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10",
    hasIcon ? "pl-10 pr-4" : "px-4"
  );

export default function Auth({ initial = "signin" }: { initial?: View }) {
  const { user, signIn, signUp, resendVerification, checkVerified } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [view, setView] = useState<View>(initial);
  const [busy, setBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // shared form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [dial, setDial] = useState("+92");
  const [phone, setPhone] = useState("");

  // ── Sign in ────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: any) {
      toast({ title: "Sign in failed", description: friendly(err), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  // ── Sign up (step 1) ───────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const profile: SignupProfile = { name, company, whatsapp: `${dial} ${phone}` };
      await signUp(email, password, profile);
      setView("verify");
    } catch (err: any) {
      toast({ title: "Could not create account", description: friendly(err), type: "error" });
    } finally {
      setBusy(false);
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

  return (
    <div className="grid min-h-screen place-items-center bg-[#081019] bg-gradient-to-br from-[#0b1c28] to-black p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="grid lg:grid-cols-2">
          {/* Left brand panel */}
          <div className="hidden lg:block">
            {view === "signin" ? <LoginBrandPanel /> : <SignupBrandPanel step={view === "verify" ? 2 : 1} />}
          </div>

          {/* Right content */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            {/* mobile logo */}
            <div className="mb-8 lg:hidden">
              <Logo variant="color" size={40} />
            </div>

            {view === "signin" && (
              <>
                <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
                  <ArrowRight className="h-6 w-6 -rotate-45 text-primary" />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Welcome Back</h1>
                <p className="mt-1 text-gray-500">Sign in to manage your business</p>

                <form onSubmit={handleSignIn} className="mt-8 space-y-5">
                  <Field icon={Mail} label="Email Address">
                    <input className={inputCls()} type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field
                    icon={Lock}
                    label="Password"
                    right={<button type="button" className="text-sm font-semibold text-primary hover:underline">Forgot?</button>}
                  >
                    <input className={cn(inputCls(), "pr-11")} type={showPwd ? "text" : "password"} required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <PwdToggle on={showPwd} set={setShowPwd} />
                  </Field>
                  <SubmitButton busy={busy}>Sign In <ArrowRight className="h-4 w-4" /></SubmitButton>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button className="font-bold text-primary hover:underline" onClick={() => setView("signup")}>Create Account</button>
                </p>
                {!FIREBASE_CONFIGURED && <DemoNote />}
                <p className="mt-8 text-center text-xs text-gray-400">Powered by {brand.shortName}</p>
              </>
            )}

            {view === "signup" && (
              <>
                <h1 className="text-3xl font-black text-gray-900">Create Your Account</h1>
                <p className="mt-1 text-gray-500">Step 1 of 2 — Account Details</p>

                <form onSubmit={handleSignUp} className="mt-7 space-y-4">
                  <Field icon={UserIcon} label="Full Name">
                    <input className={inputCls()} required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field icon={Briefcase} label="Company Name">
                    <input className={inputCls()} required placeholder="Your company" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </Field>
                  <Field icon={Mail} label="Email Address">
                    <input className={inputCls()} type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="WhatsApp Number">
                    <div className="flex gap-2">
                      <select
                        className="h-12 w-36 shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-2 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white"
                        value={dial}
                        onChange={(e) => setDial(e.target.value)}
                      >
                        {countryCodes.map((c) => (
                          <option key={c.iso} value={c.code}>{c.iso} {c.code} {c.name}</option>
                        ))}
                      </select>
                      <input className={inputCls(false)} required placeholder="3001234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </Field>
                  <Field icon={Lock} label="Password">
                    <input className={cn(inputCls(), "pr-11")} type={showPwd ? "text" : "password"} required minLength={6} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <PwdToggle on={showPwd} set={setShowPwd} />
                  </Field>
                  <SubmitButton busy={busy}>Create Account <ArrowRight className="h-4 w-4" /></SubmitButton>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button className="font-bold text-primary hover:underline" onClick={() => setView("signin")}>Sign In</button>
                </p>
              </>
            )}

            {view === "verify" && (
              <div className="text-center">
                <div className="text-left">
                  <h1 className="text-3xl font-black text-gray-900">Email Verification</h1>
                  <p className="mt-1 text-gray-500">Step 2 of 2</p>
                </div>

                <div className="mx-auto mt-10 grid h-24 w-24 place-items-center rounded-full bg-primary/10">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <h2 className="mt-6 text-2xl font-black text-gray-900">Verify Your Email</h2>
                <p className="mt-2 text-gray-500">We've sent a verification link to</p>
                <p className="font-bold text-primary">{email || user?.email}</p>
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

      <p className="mt-6 text-center text-sm text-white/40">
        {brand.fullName} — {brand.tagline}
      </p>
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

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#066a97] text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:opacity-95 disabled:opacity-70"
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
