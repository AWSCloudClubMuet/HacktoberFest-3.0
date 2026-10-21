import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { formatWhen } from '../format.js';
import { SECTIONS } from '../section.js';
import { PageHeader } from '../ui.jsx';
import { Alert, Badge, Empty, Link, Loading, statusTone, textLinkClass } from '../components.jsx';

export function ApplicationsPage() {
  const { userId, section, chooseSection } = useApp();
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
        const wanted = SECTIONS[section]?.type || 'Offering';
        const next = applications
          .slice()
          .filter((application) => byId.get(application.gig_id)?.type === wanted)
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
  }, [userId, section]);

  return (
    <div className="space-y-5">
      <PageHeader title="My applications" subtitle={section === 'request' ? 'Help you offered on requests.' : 'Services you requested from offers.'} />
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1 shadow-card" role="tablist" aria-label="Your applications">
        <button type="button" role="tab" aria-selected={section === 'offer'} className={`min-h-11 rounded-full px-2 text-sm font-semibold ${section === 'offer' ? 'fill-offer text-white' : 'text-muted'}`} onClick={() => chooseSection('offer')}>To offers</button>
        <button type="button" role="tab" aria-selected={section === 'request'} className={`min-h-11 rounded-full px-2 text-sm font-semibold ${section === 'request' ? 'fill-request text-white' : 'text-muted'}`} onClick={() => chooseSection('request')}>To requests</button>
      </div>
      <Alert>{error}</Alert>
      {rows === null && !error ? <Loading>Loading applications…</Loading> : null}
      {rows && rows.length === 0 && !error ? (
        <Empty>
          You have not applied to any gigs yet.{' '}
          <Link to="/" className={textLinkClass}>Browse gigs</Link>
        </Empty>
      ) : null}
      {rows && rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((application) => (
            <li key={application.id} className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link to={`/gigs/${application.gig_id}`} className={`${textLinkClass} min-w-0 break-words font-display text-lg`}>
                  {application.gigTitle}
                </Link>
                <Badge tone={statusTone(application.status)}>{application.status}</Badge>
              </div>
              <p className="mt-2 break-words text-base text-secondary">{application.message}</p>
              <p className="mt-2 text-sm text-muted">Applied {formatWhen(application.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
