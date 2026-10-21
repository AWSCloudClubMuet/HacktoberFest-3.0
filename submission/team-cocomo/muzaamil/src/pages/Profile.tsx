import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import { useRun } from "../components/toast";
import { Badge, Button, Card, CardHeader, Field, Input, Loading, PageHeader, Select } from "../components/ui";
import { SKILLS, type Skill } from "../lib/format";

/** The signed-in person's own details. Volunteers edit name, skill and phone here. */
export default function Profile() {
  const profile = useQuery(api.me.profile);
  const run = useRun();
  const save = useMutation(api.me.saveProfile);

  const [name, setName] = useState("");
  const [skill, setSkill] = useState<Skill>("Logistics");
  const [phone, setPhone] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (profile && !loaded) {
      setName(profile.name);
      setPhone(profile.volunteer?.phone ?? "");
      if (profile.volunteer?.skill) setSkill(profile.volunteer.skill);
      setLoaded(true);
    }
  }, [profile, loaded]);

  if (profile === undefined) return <Loading />;

  const dirty = name !== profile.name || phone !== (profile.volunteer?.phone ?? "") || (!!profile.volunteer && skill !== profile.volunteer.skill);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(save({ name, skill, phone: phone || undefined }), "Profile saved");
    if (ok) setLoaded(false);
  };

  return (
    <>
      <PageHeader
        kicker="Profile"
        title={profile.name || "Your profile"}
        deck={profile.email}
        actions={<Badge tone={profile.role === "coordinator" ? "info" : "neutral"}>{profile.role === "coordinator" ? "Coordinator" : "Field volunteer"}</Badge>}
      />

      <div className="grid grid-cols-[1.4fr_1fr] gap-6">
        <Card>
          <CardHeader title="Your details" sub={profile.role === "coordinator" ? "Only your name is editable" : "This is what coordinators and your camp see"} />
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4 px-6 pb-6">
            <Field label="Full name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required maxLength={80} />
            </Field>
            {profile.role !== "coordinator" && (
              <>
                <Field label="Main skill" hint="Coordinators use this when assigning people to camps">
                  <Select value={skill} onChange={(e) => setSkill(e.target.value as Skill)}>
                    {SKILLS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Phone" hint="Optional, so your camp can reach you">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" maxLength={30} />
                </Field>
              </>
            )}
            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={!name.trim() || (profile.role !== "coordinator" && !dirty && !!profile.volunteer)}>
                Save profile
              </Button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Account" />
            <div className="flex flex-col gap-3 px-6 pb-6 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Email</span>
                <span className="font-semibold">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Role</span>
                <span className="font-semibold">{profile.role === "coordinator" ? "Coordinator" : "Field volunteer"}</span>
              </div>
              {profile.volunteer && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Assigned camp</span>
                  <span className="font-semibold">{profile.volunteer.campName ?? "Not assigned yet"}</span>
                </div>
              )}
            </div>
          </Card>
          {profile.role !== "coordinator" && (
            <Card>
              <CardHeader title="Camp assignment" sub="Set by coordinators" />
              <p className="px-6 pb-6 text-sm text-muted">
                You can't move yourself between camps. Ask a coordinator to change your assignment from the Volunteers
                page, and your new camp's needs and deliveries will appear under My assignment.
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
