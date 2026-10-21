import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { formatWhen } from '../format.js';
import { Alert, Badge, Empty, Link, Loading, statusTone } from '../components.jsx';

export function ApplicationsPage() {
  const { userId } = useApp();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([
      api(`/applications?applicant_id=${encodeURIComponent(userId)}`),
      api('/gigs'),
    ])
      .then(([applications, gigs]) => {
        if (cancelled) return;
        const byId = new Map(gigs.map((gig) => [gig.id, gig]));
        const next = applications
          .slice()
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((application) => ({
            ...application,
            gigTitle: byId.get(application.gig_id)?.title || 'Untitled gig',
          }));
        setRows(next);
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
        <h1 className="text-2xl font-semibold text-stone-900">My applications</h1>
        <p className="mt-1 text-sm text-stone-600">Gigs you have applied to.</p>
      </div>
      <Alert>{error}</Alert>
      {rows === null && !error ? <Loading>Loading applications…</Loading> : null}
      {rows && rows.length === 0 && !error ? (
        <Empty>
          You have not applied to any gigs yet.{' '}
          <Link to="/" className="font-medium text-teal-800 hover:underline">Browse gigs</Link>
        </Empty>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((application) => (
            <li key={application.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link to={`/gigs/${application.gig_id}`} className="font-medium text-teal-900 hover:underline">
                  {application.gigTitle}
                </Link>
                <Badge tone={statusTone(application.status)}>{application.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-stone-700">{application.message}</p>
              <p className="mt-2 text-xs text-stone-500">Applied {formatWhen(application.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
