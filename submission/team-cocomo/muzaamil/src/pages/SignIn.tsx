import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Badge, Button, Card, Field, Input, Mark, Notice, Segmented, cx } from "../components/ui";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useI18n } from "../i18n";

type Role = "coordinator" | "volunteer";

/** Shared test accounts. The first quick sign-in creates the account if it doesn't exist yet. */
const DEMO: Record<Role, { email: string; password: string; name: string; title: string; body: string }> = {
  coordinator: {
    email: "coordinator@reliefhub.demo",
    password: "reliefhub-demo-2026",
    name: "Demo Coordinator",
    title: "Coordinator",
    body: "Full access, can edit",
  },
  volunteer: {
    email: "volunteer@reliefhub.demo",
    password: "reliefhub-demo-2026",
    name: "Demo Volunteer",
    title: "Field Volunteer",
    body: "Assigned camp and deliveries",
  },
};

function friendlyAuthError(err: unknown, flow: "signIn" | "signUp") {
  const msg = err instanceof Error ? err.message : String(err);
  if (/InvalidSecret|InvalidAccountId|Invalid credentials/i.test(msg)) return "That email and password don't match an account.";
  if (/already exists/i.test(msg)) return "An account with this email already exists. Sign in instead.";
  if (/password/i.test(msg) && flow === "signUp") return "Use a password of at least 8 characters.";
  const custom = msg.match(/Uncaught (?:Convex)?Error: (.*?)(?:\n|\s+at |$)/);
  const detail = custom?.[1] ?? msg;
  if (detail === "Enter a valid email address" || detail === "Shared test accounts are disabled. Use your own account.") return detail;
  return "Couldn't sign you in. Check your details and try again.";
}

const isMissingAccount = (err: unknown) => /InvalidAccountId/i.test(err instanceof Error ? err.message : String(err));

export default function SignIn() {
  const { t, dir } = useI18n();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const demoMode = useQuery(api.users.demoMode);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "form" | Role>(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set("flow", flow);
    setBusy("form");
    try {
      await signIn("password", form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err, flow));
      setBusy(false);
    }
  }

  async function quickSignIn(r: Role) {
    const demo = DEMO[r];
    setFlow("signIn");
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setBusy(r);
    try {
      await signIn("password", { email: demo.email, password: demo.password, flow: "signIn" });
      navigate("/", { replace: true });
    } catch (err) {
      if (!isMissingAccount(err)) {
        setError(friendlyAuthError(err, "signIn"));
        setBusy(false);
        return;
      }
      try {
        await signIn("password", { email: demo.email, password: demo.password, name: demo.name, role: r, flow: "signUp" });
        navigate("/", { replace: true });
      } catch (err2) {
        setError(friendlyAuthError(err2, "signUp"));
        setBusy(false);
      }
    }
  }

  const quickButton = (r: Role) => (
    <button
      type="button"
      aria-label={t("Sign in as {role}", { role: t(DEMO[r].title) })}
      disabled={!!busy}
      onClick={() => void quickSignIn(r)}
      className={cx(
        "flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 text-start transition-colors disabled:cursor-wait disabled:opacity-60",
        r === "coordinator" ? "border-info-line bg-info-wash hover:border-info" : "border-ok-line bg-ok-wash hover:border-ok",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white",
          r === "coordinator" ? "bg-info" : "bg-ok",
        )}
      >
        {t(r === "coordinator" ? "RC" : "FV")}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cx("truncate text-sm font-bold", r === "coordinator" ? "text-info-ink" : "text-ok-ink")}>
          {t(busy === r ? "Signing in…" : DEMO[r].title)}
        </span>
        <span title={t(DEMO[r].body)} className="truncate text-xs text-muted">{t(DEMO[r].body)}</span>
      </span>
    </button>
  );

  const feature = (title: string, body: string) => (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <span className="text-sm font-bold">{t(title)}</span>
      <span className="text-[13px] leading-[19px] text-white/60">{t(body)}</span>
    </div>
  );

  return (
    <div dir={dir} className="flex min-h-screen bg-canvas">
      <aside className="flex w-[43%] max-w-[620px] flex-col justify-between bg-ink p-12 text-white">
        <div className="flex items-center gap-2.5">
          <Mark size={32} />
          <span className="text-[22px] font-extrabold tracking-[-0.02em]">ReliefHub</span>
        </div>
        <div className="rise flex flex-col gap-6">
          <Badge tone="brand" className="w-fit">
            {t("Sindh flood response")}
          </Badge>
          <h1 className="display text-[52px] leading-[58px]">
            {t("One shared view of every camp, truck")} <span className="text-signal">{t("and sack of rice.")}</span>
          </h1>
          <p className="max-w-[440px] text-[17px] leading-[26px] text-white/70">{t("So no camp gets two deliveries of rice while another waits for insulin.")}</p>
          <div className="grid grid-cols-3 gap-3">
            {feature("Live map", "Every camp and its gaps")}
            {feature("Stock-safe", "Dispatches reserve stock")}
            {feature("Role-based", "Coordinators and field teams")}
          </div>
        </div>
        <div className="font-mono text-xs text-white/50">{t("Real-time · role-based access")}</div>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-12">
        <LanguageSwitcher />
        <Card className="w-[460px] p-8">
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="display text-[32px] leading-[38px]">{t(flow === "signIn" ? "Sign in" : "Create an account")}</h2>
              <p className="text-[15px] text-muted">{t(flow === "signIn" ? "Welcome back. Sign in to your assigned role." : "Join as a field volunteer. Coordinator access is granted by the deployment administrator.")}</p>
            </div>

            {demoMode && (
              <div className="flex flex-col gap-2 rounded-[20px] border border-dashed border-line-strong bg-tint p-3">
                <span className="label">{t("Quick test sign-in")}</span>
                <div className="flex gap-2.5">
                  {quickButton("coordinator")}
                  {quickButton("volunteer")}
                </div>
                <span className="text-xs text-muted">{t("Demo mode · shared accounts for testing")}</span>
              </div>
            )}

            {demoMode && (
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                {t("or use your own account")}
                <span className="h-px flex-1 bg-line" />
              </div>
            )}

            <Segmented
              size="sm"
              value={flow}
              onChange={(f) => {
                setFlow(f);
                setError(null);
              }}
              options={[
                { value: "signIn", label: t("Sign in") },
                { value: "signUp", label: t("Sign up") },
              ]}
            />

            {flow === "signUp" && (
              <Field label={t("Full name")}>
                <Input name="name" required autoComplete="name" placeholder={t("Your full name")} onInvalid={(e) => e.currentTarget.setCustomValidity(t("Enter your full name."))} onInput={(e) => e.currentTarget.setCustomValidity("")} />
              </Field>
            )}
            <Field label={t("Email")}>
              <Input name="email" type="email" dir="ltr" required autoComplete="email" placeholder="you@organisation.pk" value={email} onChange={(e) => { e.currentTarget.setCustomValidity(""); setEmail(e.target.value); }} onInvalid={(e) => e.currentTarget.setCustomValidity(t("Enter a valid email address"))} />
            </Field>
            <Field label={t("Password")} hint={flow === "signUp" ? t("At least 8 characters") : undefined}>
              <Input
                name="password"
                type="password"
                dir="ltr"
                required
                minLength={8}
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => { e.currentTarget.setCustomValidity(""); setPassword(e.target.value); }}
                onInvalid={(e) => e.currentTarget.setCustomValidity(t("Use a password of at least 8 characters."))}
              />
            </Field>

            {flow === "signUp" && (
              <Notice tone="info">{t("You can view your assigned camp, its needs, deliveries and team, update your profile, and confirm deliveries arriving at your camp.")}</Notice>
            )}

            {error && <Notice tone="error">{t(error)}</Notice>}

            <Button type="submit" size="lg" disabled={!!busy}>
              {t(busy === "form" ? "Please wait…" : flow === "signIn" ? "Sign in" : "Create field volunteer account")}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
