import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { paymentLabel } from '../constants.js';
import { PageHeader } from '../ui.jsx';
import { formatMoney } from '../format.js';
import { Alert, Badge, Empty, Link, Loading, statusTone, textLinkClass } from '../components.jsx';

const GIG_TABS = [
  { id: 'offered', type: 'Offering', label: 'Offered by me' },
  { id: 'requested', type: 'Requesting', label: 'Requested by me' },
];

export function MyGigsPage() {
  const { userId } = useApp();
  const [tab, setTab] = useState('offered');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const current = GIG_TABS.find((item) => item.id === tab) || GIG_TABS[0];

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

  const visible = rows ? rows.filter((gig) => gig.type === current.type) : null;

  return (
    <div className="space-y-5">
      <PageHeader title="My gigs" subtitle="Everything you posted, whether you offered a skill or asked for help." />
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1 shadow-card" role="tablist" aria-label="Your gigs">
        {GIG_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`min-h-11 rounded-full px-2 text-sm font-semibold ${tab === item.id ? (item.id === 'requested' ? 'fill-request text-white' : 'fill-offer text-white') : 'text-muted'}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {visible === null && !error ? <Loading>Loading your gigs…</Loading> : null}
      {visible && visible.length === 0 && !error ? (
        <Empty>
          Nothing in this list yet.{' '}
          <Link to={`/gigs/new?type=${current.type}`} className={textLinkClass}>Post one</Link>
        </Empty>
      ) : null}
      {visible && visible.length > 0 ? (
        <ul className="space-y-3">
          {visible.map((gig) => (
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
