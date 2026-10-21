import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { Alert, Badge, Empty, Loading, Stars } from '../components.jsx';

export function ProfilePage({ profileId }) {
  const { userId, users } = useApp();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      api(`/users/${encodeURIComponent(profileId)}`),
      api(`/reviews?reviewee_id=${encodeURIComponent(profileId)}`),
    ])
      .then(([nextProfile, nextReviews]) => {
        if (cancelled) return;
        setProfile(nextProfile);
        setReviews(nextReviews.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
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
          hint={profile.average_rating == null ? 'No reviews yet' : 'From stored reviews'}
        />
      </dl>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">Reviews</h2>
        {reviews.length === 0 ? <Empty>No reviews yet.</Empty> : null}
        <ul className="space-y-3">
          {reviews.map((review) => {
            const reviewer = users.find((user) => user.id === review.reviewer_id);
            return (
              <li key={review.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-900">{reviewer?.name || 'Student'}</p>
                  <Stars value={review.rating} />
                </div>
                <p className="mt-2 text-sm text-stone-700">{review.comment}</p>
              </li>
            );
          })}
        </ul>
      </section>
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
