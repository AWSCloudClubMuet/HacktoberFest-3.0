import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useRun } from "../components/toast";
import { Badge, Button, Card, CardHeader, Field, Input, Loading, LockIcon, PageHeader, Select } from "../components/ui";
import { initials, SKILLS, type Skill } from "../lib/format";
import { useI18n } from "../i18n";

type Details = { name: string; skill: Skill; phone: string };
const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

/** The signed-in person's own details. Role and camp assignment stay read-only. */
export default function Profile() {
  const { t, dir } = useI18n();
  const profile = useQuery(api.me.profile);
  const run = useRun();
  const save = useMutation(api.me.saveProfile);
  // A pristine form follows live profile updates; an edited form keeps its draft.
  const [draft, setDraft] = useState<Details | null>(null);
  const [saving, setSaving] = useState(false);

  if (profile === undefined) return <Loading />;

  const isCoordinator = profile.role === "coordinator";
  const original: Details = {
    name: profile.name,
    skill: profile.volunteer?.skill ?? "Logistics",
    phone: profile.volunteer?.phone ?? "",
  };
  const details = draft ?? original;
  const needsRoster = !isCoordinator && !profile.volunteer;
  const dirty = normalizeName(details.name) !== original.name ||
    (!isCoordinator && (details.phone.trim() !== original.phone || details.skill !== original.skill));
  const canSave = !!normalizeName(details.name) && (dirty || needsRoster) && !saving;

  const change = (field: keyof Details, value: string) => {
    setDraft({ ...details, [field]: value });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const ok = await run(save({
        name: normalizeName(details.name),
        ...(!isCoordinator ? { skill: details.skill, phone: details.phone.trim() || undefined } : {}),
      }), t("Profile saved"));
      if (ok) setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={dir} className="flex w-full max-w-[1120px] flex-col gap-6">
      <PageHeader
        kicker={t("My account")}
        title={t("Your profile")}
        deck={t(isCoordinator ? "Manage your personal account details." : "Keep your details up to date so coordinators can plan your field work.")}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title={t("Personal details")}
            sub={t(isCoordinator ? "Update the name shown on your account." : "Your name and skills are shared with your camp team.")}
          />
          <form onSubmit={(e) => void submit(e)} aria-busy={saving}>
            <fieldset disabled={saving} className="flex min-w-0 flex-col gap-5 p-5">
              <Field label={t("Full name")}>
                <Input name="name" autoComplete="name" value={details.name} onChange={(e) => { e.currentTarget.setCustomValidity(""); change("name", e.target.value); }} placeholder={t("Your full name")} required maxLength={80} onInvalid={(e) => e.currentTarget.setCustomValidity(t("Enter your full name."))} />
              </Field>
              {!isCoordinator && (
                <>
                  <Field label={t("Main skill")} hint={t("Helps coordinators match you to a camp's needs.")}>
                    <Select name="skill" value={details.skill} onChange={(e) => change("skill", e.target.value)}>
                      {SKILLS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
                    </Select>
                  </Field>
                  <Field label={<>{t("Phone number")} <span className="ms-1 font-normal text-muted">{t("(optional)")}</span></>} hint={t("Only coordinators can see your phone number.")}>
                    <Input name="phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" value={details.phone} onChange={(e) => change("phone", e.target.value)} placeholder="03xx xxxxxxx" maxLength={30} />
                  </Field>
                </>
              )}
            </fieldset>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-tint px-5 py-4">
              <span role="status" aria-live="polite" className="text-xs leading-5 text-muted">
                {t(saving ? "Saving your details…" : needsRoster ? "Save to join the volunteer roster." : dirty ? "You have unsaved changes." : "Your details are up to date.")}
              </span>
              <Button type="submit" disabled={!canSave}>{t(saving ? "Saving…" : "Save profile")}</Button>
            </div>
          </form>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title={t("Account")} right={<span className="text-faint" aria-hidden="true"><LockIcon /></span>} />
            <div className="flex flex-col gap-5 p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white">
                  {initials(profile.name) || "?"}
                </span>
                <div className="flex min-w-0 flex-col items-start gap-1.5">
                  <p className="max-w-full break-words text-sm font-semibold leading-5">{profile.name || t("Your account")}</p>
                  <Badge tone={isCoordinator ? "info" : "neutral"}>{t(isCoordinator ? "Coordinator" : "Field volunteer")}</Badge>
                </div>
              </div>
              <dl className="border-t border-line pt-4">
                <dt className="mb-1.5 text-xs text-muted">{t("Email address")}</dt>
                <dd dir="ltr" className="break-words text-start text-sm font-medium leading-6">{profile.email}</dd>
              </dl>
              <p className="text-xs leading-5 text-muted">{t("Your sign-in email and role are read-only here.")}</p>
            </div>
          </Card>

          {!isCoordinator && (
            <Card>
              <CardHeader title={t("Camp assignment")} sub={t("Managed by your coordinator")} />
              <div className="flex flex-col items-start gap-4 p-5">
                <Badge tone={profile.volunteer?.campName ? "info" : "neutral"} dot>
                  {t(profile.volunteer?.campName ? "Assigned" : "Not assigned yet")}
                </Badge>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="break-words text-lg font-bold leading-6 tracking-[-0.01em]">
                    {profile.volunteer?.campName ?? t("Your next placement")}
                  </h3>
                  <p className="text-[13px] leading-5 text-muted">
                    {t(profile.volunteer?.campName
                      ? "Find your camp's needs, incoming deliveries and team under My assignment. Contact your coordinator to change camps."
                      : needsRoster
                        ? "Save your details to join the roster. A coordinator can then assign you to a camp."
                        : "You're on the roster. Your camp will appear here once a coordinator assigns you.")}
                  </p>
                </div>
                {profile.volunteer?.campName && (
                  <Link to="/assignment" className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                    {t("View my assignment")}
                    <svg aria-hidden="true" className="rtl:rotate-180" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
