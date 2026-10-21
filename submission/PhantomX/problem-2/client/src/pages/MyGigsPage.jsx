import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { paymentLabel } from '../constants.js';
import { SECTIONS } from '../section.js';
import { PageHeader } from '../ui.jsx';
import { formatMoney } from '../format.js';
import { Alert, Badge, Empty, Link, Loading, statusTone, textLinkClass } from '../components.jsx';

export function MyGigsPage() {
  const { userId, section, chooseSection } = useApp();
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
          .filter((gig) => gig.type === (SECTIONS[section]?.type || 'Offering'))
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
  }, [userId, section]);

  return (
    <div className="space-y-5">
      <PageHeader title="My gigs" subtitle="Gigs you posted, with their status and applicant count." />
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1 shadow-card" role="tablist" aria-label="Your gigs">
        <button type="button" role="tab" aria-selected={section === 'offer'} className={`min-h-11 rounded-full text-sm font-semibold ${section === 'offer' ? 'fill-offer text-white' : 'text-muted'}`} onClick={() => chooseSection('offer')}>Offered</button>
        <button type="button" role="tab" aria-selected={section === 'request'} className={`min-h-11 rounded-full text-sm font-semibold ${section === 'request' ? 'fill-request text-white' : 'text-muted'}`} onClick={() => chooseSection('request')}>Requested</button>
      </div>
      <Alert>{error}</Alert>
      {rows === null && !error ? <Loading>Loading your gigs…</Loading> : null}
      {rows && rows.length === 0 && !error ? (
        <Empty>
          You have not posted a gig yet.{' '}
          <Link to={`/gigs/new?type=${SECTIONS[section].type}`} className={textLinkClass}>Post one</Link>
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
