import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { Button, Field, Feedback, Panel } from "@/components/ui-kit";

export function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("admin@pharmacy.local");
  const [password, setPassword] = useState("pharmacy123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[radial-gradient(circle_at_20%_10%,#b8f2e9,transparent_35%),linear-gradient(135deg,#edfafa,#dff5f2)] p-4">
      <div className="grid w-full max-w-[980px] overflow-hidden rounded-[32px] border border-white bg-white/70 shadow-[0_35px_100px_rgba(0,65,68,.18)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="flex min-h-[285px] flex-col justify-between bg-[#003f42] p-7 text-white sm:min-h-[340px] sm:p-10 lg:min-h-[620px] lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#7be3d7] text-2xl text-[#003f42]">
                +
              </span>
              <span className="text-2xl font-semibold">Pharmacy</span>
            </div>
            <h1 className="mt-10 max-w-md text-3xl font-medium leading-[1.08] tracking-[-.055em] sm:mt-14 sm:text-4xl lg:mt-24 lg:text-5xl">
              Everything your pharmacy needs, in one calm workspace.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Inventory, orders, customers, payments and reports — securely
              connected.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/65">
            <ShieldCheck size={18} className="text-[#7be3d7]" />
            Protected local workspace
          </div>
        </section>
        <section className="flex min-h-[620px] items-center p-7 sm:p-12">
          <form onSubmit={submit} className="mx-auto w-full max-w-sm">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#16998e]">
              Welcome back
            </p>
            <h2 className="mt-2 text-3xl font-medium tracking-[-.045em]">
              Sign in to Pharmacy
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter your workspace credentials to continue.
            </p>
            <div className="mt-8 space-y-4">
              <Field
                label="Email address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <label className="block space-y-1.5">
                <span className="text-[10px] font-semibold text-[#34585b]">
                  Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-white/65 px-4 pr-11 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>
            </div>
            {error && (
              <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-[11px] text-[#aa4545]">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="mt-6 w-full">
              {submitting ? "Signing in..." : "Sign in"}
              <ArrowRight size={14} />
            </Button>
            <div className="mt-6 rounded-2xl border border-[#cfe9e6] bg-[#e8f7f5] p-4 text-[#416b6d]">
              <p className="mb-2 text-xs font-bold text-[#004b4e]">
                بيانات الدخول التجريبية
              </p>
              <div className="grid gap-1.5 text-[11px] leading-5">
                <p>
                  <span className="font-semibold">البريد الإلكتروني:</span>{" "}
                  <bdi className="font-mono">admin@pharmacy.local</bdi>
                </p>
                <p>
                  <span className="font-semibold">كلمة المرور:</span>{" "}
                  <bdi className="font-mono">pharmacy123</bdi>
                </p>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState<UserProfile>(user!);
  const [message, setMessage] = useState("");
  const fields = [form.name, form.phone, form.address, form.licenseNumber];
  const completion = Math.round(
    (fields.filter(Boolean).length / fields.length) * 100,
  );
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setMessage("Could not save profile");
      return;
    }
    const updated = await response.json();
    updateUser(updated);
    setForm(updated);
    setMessage(
      updated.verified
        ? "Identity profile verified"
        : "Profile saved — complete all fields to verify",
    );
  };
  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Account / Identity
          </p>
          <h2 className="mt-1 text-3xl font-medium tracking-[-.045em]">
            Complete Profile
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete Your Profile to Unlock all Features
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-border bg-white/60 px-4 py-2">
          <div className="grid size-10 place-items-center rounded-full border-[3px] border-primary border-r-transparent text-[9px] font-bold">
            {completion}%
          </div>
          <div>
            <p className="text-xs font-semibold">Profile progress</p>
            <p className="text-[9px] text-muted-foreground">
              {form.verified ? "Verified" : "Verification pending"}
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={save} className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Panel className="p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#d9f3ef] text-primary">
              <UserRound size={19} />
            </span>
            <div>
              <h3 className="text-base font-semibold">Identity details</h3>
              <p className="text-[10px] text-muted-foreground">
                Used for pharmacy ownership and workspace verification.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
            <Field label="Email address" disabled value={form.email} />
            <Field
              label="Phone number"
              required
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
            <Field
              label="Role"
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
            />
            <Field
              label="Pharmacy license number"
              required
              value={form.licenseNumber}
              onChange={(event) =>
                setForm({ ...form, licenseNumber: event.target.value })
              }
            />
            <Field
              label="Address"
              required
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
            />
          </div>
          <div className="mt-7 flex justify-end">
            <Button type="submit">
              <Save size={14} />
              Save & verify
            </Button>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={20}
                className={
                  form.verified ? "text-[#31a484]" : "text-muted-foreground"
                }
              />
              <div>
                <p className="text-sm font-semibold">Verification status</p>
                <p className="text-[10px] text-muted-foreground">
                  {form.verified
                    ? "Your identity profile is complete."
                    : "Fill every required field to verify."}
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="bg-gradient-to-br from-[#9debe2] to-[#d8f7f2] p-5">
            <LockKeyhole size={20} />
            <h3 className="mt-5 text-base font-semibold">
              Your data stays private
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#436b6e]">
              Profile information is stored in your local pharmacy workspace and
              is not shared externally.
            </p>
          </Panel>
        </div>
      </form>
      {message && (
        <Feedback message={message} error={message.startsWith("Could")} />
      )}
    </div>
  );
}
