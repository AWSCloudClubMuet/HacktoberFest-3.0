import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Badge, Button, Card, Field, Input, Mark, Notice, Segmented, cx } from "../components/ui";

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
    body: "View, mark delivered",
  },
};

function friendlyAuthError(err: unknown, flow: "signIn" | "signUp") {
  const msg = err instanceof Error ? err.message : String(err);
  if (/InvalidSecret|InvalidAccountId|Invalid credentials/i.test(msg)) return "That email and password don't match an account.";
  if (/already exists/i.test(msg)) return "An account with this email already exists. Sign in instead.";
  if (/password/i.test(msg) && flow === "signUp") return "Use a password of at least 8 characters.";
  const custom = msg.match(/Uncaught (?:Convex)?Error: (.*?)(?:\n|\s+at |$)/);
  return custom ? custom[1] : "Couldn't sign you in. Check your details and try again.";
}

const isMissingAccount = (err: unknown) => /InvalidAccountId/i.test(err instanceof Error ? err.message : String(err));

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [role, setRole] = useState<Role>("coordinator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<false | "form" | Role>(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    form.set("flow", flow);
    if (flow === "signUp") form.set("role", role);
    setBusy("form");
    try {
      await signIn("password", form);
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
    } catch (err) {
      if (!isMissingAccount(err)) {
        setError(friendlyAuthError(err, "signIn"));
        setBusy(false);
        return;
      }
      try {
        await signIn("password", { email: demo.email, password: demo.password, name: demo.name, role: r, flow: "signUp" });
      } catch (err2) {
        setError(friendlyAuthError(err2, "signUp"));
        setBusy(false);
      }
    }
  }

  const roleCard = (value: Role, title: string, body: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={cx(
        "flex flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-3.5 text-left transition-colors",
        role === value ? "border-info bg-info-wash ring-1 ring-info" : "border-line-strong hover:border-ink",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold">{title}</span>
        <span className={cx("size-4 shrink-0 rounded-full bg-white", role === value ? "border-[5px] border-info" : "border-[1.5px] border-faint")} />
      </span>
      <span className="text-[13px] leading-[19px] text-ink-2">{body}</span>
    </button>
  );

  const quickButton = (r: Role) => (
    <button
      type="button"
      disabled={!!busy}
      onClick={() => void quickSignIn(r)}
      className={cx(
        "flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors disabled:cursor-wait disabled:opacity-60",
        r === "coordinator" ? "border-info-line bg-info-wash hover:border-info" : "border-ok-line bg-ok-wash hover:border-ok",
      )}
    >
      <span
        className={cx(
          "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white",
          r === "coordinator" ? "bg-info" : "bg-ok",
        )}
      >
        {r === "coordinator" ? "RC" : "FV"}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cx("text-sm font-bold", r === "coordinator" ? "text-info-ink" : "text-ok-ink")}>
          {busy === r ? "Signing in…" : DEMO[r].title}
        </span>
        <span className="truncate text-xs text-muted">{DEMO[r].body}</span>
      </span>
    </button>
  );

  const feature = (title: string, body: string) => (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <span className="text-sm font-bold">{title}</span>
      <span className="text-[13px] leading-[19px] text-white/60">{body}</span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="flex w-[43%] max-w-[620px] flex-col justify-between bg-ink p-12 text-white">
        <div className="flex items-center gap-2.5">
          <Mark size={32} />
          <span className="text-[22px] font-extrabold tracking-[-0.02em]">ReliefHub</span>
        </div>
        <div className="rise flex flex-col gap-6">
          <Badge tone="brand" className="w-fit">
            Sindh flood response
          </Badge>
          <h1 className="display text-[52px] leading-[58px]">
            One shared view of every camp, truck <span className="text-signal">and sack of rice.</span>
          </h1>
          <p className="max-w-[440px] text-[17px] leading-[26px] text-white/70">So no camp gets two deliveries of rice while another waits for insulin.</p>
          <div className="grid grid-cols-3 gap-3">
            {feature("Live map", "Every camp and its gaps")}
            {feature("Stock-safe", "Dispatches reserve stock")}
            {feature("Role-based", "Coordinators and field teams")}
          </div>
        </div>
        <div className="font-mono text-xs text-white/50">Real-time · role-based access</div>
      </aside>

      <main className="flex flex-1 items-center justify-center p-12">
        <Card className="w-[460px] p-8">
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="display text-[32px] leading-[38px]">{flow === "signIn" ? "Sign in" : "Create an account"}</h2>
              <p className="text-[15px] text-muted">{flow === "signIn" ? "Welcome back. Your role was set when you joined." : "Choose how you'll be working."}</p>
            </div>

            <div className="flex flex-col gap-2 rounded-[20px] border border-dashed border-line-strong bg-tint p-3">
              <span className="label">Quick test sign-in</span>
              <div className="flex gap-2.5">
                {quickButton("coordinator")}
                {quickButton("volunteer")}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" />
              or use your own account
              <span className="h-px flex-1 bg-line" />
            </div>

            <Segmented
              size="sm"
              value={flow}
              onChange={(f) => {
                setFlow(f);
                setError(null);
              }}
              options={[
                { value: "signIn", label: "Sign in" },
                { value: "signUp", label: "Sign up" },
              ]}
            />

            {flow === "signUp" && (
              <Field label="Full name">
                <Input name="name" required autoComplete="name" placeholder="Ayesha Khan" />
              </Field>
            )}
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" placeholder="you@organisation.pk" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" hint={flow === "signUp" ? "At least 8 characters" : undefined}>
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {flow === "signUp" && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-ink-2">Role</span>
                <div className="flex gap-3">
                  {roleCard("coordinator", "Relief Coordinator", "Create and edit camps, needs and stock. Dispatch supplies. Assign volunteers.")}
                  {roleCard("volunteer", "Field Volunteer", "See camps, needs and stock. Mark dispatches delivered on arrival.")}
                </div>
              </div>
            )}

            {error && <Notice tone="error">{error}</Notice>}

            <Button type="submit" size="lg" disabled={!!busy}>
              {busy === "form" ? "Please wait…" : flow === "signIn" ? "Sign in" : `Create account as ${role === "coordinator" ? "Coordinator" : "Field Volunteer"}`}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
