import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { Alert, Badge, Loading } from '../components.jsx';

export function ProfilePage({ profileId }) {
  const { userId } = useApp();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api(`/users/${encodeURIComponent(profileId)}`)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) return <Loading>Loading profile…</Loading>;
  if (error) return <Alert>{error}</Alert>;
  if (!profile) return <Alert>User not found</Alert>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        {profile.id === userId ? <p className="text-sm font-medium text-teal-800">Your profile</p> : null}
        <h1 className="text-2xl font-semibold text-stone-900">{profile.name}</h1>
        <p className="mt-1 text-sm text-stone-600">{profile.major} · Semester {profile.semester}</p>
      </div>
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-sm leading-6 text-stone-700">{profile.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.length > 0
            ? profile.skills.map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)
            : <span className="text-sm text-stone-500">No skills listed</span>}
        </div>
      </section>
      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat label="Gigs posted" value={profile.gigs_posted} />
        <Stat label="Gigs completed" value={profile.gigs_completed} />
        <Stat
          label="Average rating"
          value={profile.average_rating == null ? '—' : profile.average_rating}
          hint={profile.average_rating == null ? 'No reviews yet' : 'From completed reviews'}
        />
      </dl>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-stone-900">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
