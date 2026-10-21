import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { paymentLabel } from '../constants.js';
import { formatMoney } from '../format.js';
import { Alert, Badge, Empty, Link, Loading, statusTone, textLinkClass } from '../components.jsx';

export function MyGigsPage() {
  const { userId } = useApp();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([api('/gigs'), api('/applications')])
      .then(([gigs, applications]) => {
        if (cancelled) return;
        const counts = new Map();
        for (const application of applications) {
          counts.set(application.gig_id, (counts.get(application.gig_id) || 0) + 1);
        }
        const mine = gigs
          .filter((gig) => gig.user_id === userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((gig) => ({ ...gig, applicantCount: counts.get(gig.id) || 0 }));
        setRows(mine);
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title text-ink">My gigs</h1>
        <p className="mt-2 text-base text-muted">Gigs you posted, with their status and applicant count.</p>
      </div>
      <Alert>{error}</Alert>
      {rows === null && !error ? <Loading>Loading your gigs…</Loading> : null}
      {rows && rows.length === 0 && !error ? (
        <Empty>
          You have not posted a gig yet.{' '}
          <Link to="/gigs/new" className={textLinkClass}>Post one</Link>
        </Empty>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((gig) => (
            <li key={gig.id}>
              <Link to={`/gigs/${gig.id}`} className="block min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-primary">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words font-display text-lg font-semibold text-ink">{gig.title}</h2>
                  <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
                </div>
                <p className="mt-2 break-words text-sm text-muted">
                  {gig.category} · {gig.type} · {paymentLabel(gig.payment_type)}
                  {gig.payment_type === 'Paid' && gig.budget != null ? ` · ${formatMoney(gig.budget)}` : ''}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {gig.applicantCount} {gig.applicantCount === 1 ? 'applicant' : 'applicants'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
