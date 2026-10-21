import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { Alert, Badge, Empty, Loading, Stars, cardClass } from '../components.jsx';
import { initials } from '../format.js';

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
    <div className="space-y-4">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="hero-offer flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 font-display text-xl font-semibold text-on-night" aria-hidden="true">
            {initials(profile.name)}
          </div>
          <div className="min-w-0">
            {profile.id === userId ? <p className="text-sm font-semibold text-on-night-muted">Your profile</p> : null}
            <h1 className="page-title break-words">{profile.name}</h1>
            <p className="mt-1 text-sm text-on-night-muted">{profile.major} · Semester {profile.semester}</p>
          </div>
        </div>
      </div>
      <section className={`${cardClass} p-4`}>
        <p className="break-words text-base leading-7 text-secondary">{profile.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills.length > 0
            ? profile.skills.map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)
            : <span className="text-sm text-muted">No skills listed</span>}
        </div>
      </section>
      <dl className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat label="Gigs posted" value={profile.gigs_posted} />
        <Stat label="Gigs completed" value={profile.gigs_completed} />
        <Stat
          label="Average rating"
          value={profile.average_rating == null ? '—' : profile.average_rating}
          hint={profile.average_rating == null ? 'No reviews yet' : 'From stored reviews'}
          stars={profile.average_rating}
        />
      </dl>
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Reviews</h2>
        {reviews.length === 0 ? <Empty>No reviews yet.</Empty> : null}
        <ul className="space-y-3">
          {reviews.map((review) => {
            const reviewer = users.find((user) => user.id === review.reviewer_id);
            return (
              <li key={review.id} className={`${cardClass} p-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 break-words text-base font-semibold text-ink">{reviewer?.name || 'Student'}</p>
                  <Stars value={review.rating} />
                </div>
                <p className="mt-2 break-words text-base text-secondary">{review.comment}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, hint, stars }) {
  return (
    <div className={`${cardClass} p-4`}>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-ink">{value}</dd>
      {stars != null ? <div className="mt-1"><Stars value={stars} /></div> : null}
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
