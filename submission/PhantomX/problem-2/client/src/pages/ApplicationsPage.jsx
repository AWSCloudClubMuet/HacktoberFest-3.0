import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { formatWhen } from '../format.js';
import { PageHeader } from '../ui.jsx';
import { Alert, Badge, Empty, Link, Loading, statusTone, textLinkClass } from '../components.jsx';
import { StatusTracker, Tabs, wasAutoRejected } from '../flow.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Pending', label: 'Under review' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Rejected', label: 'Rejected' },
];

export function ApplicationsPage() {
  const { userId, section } = useApp();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

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
            gig: byId.get(application.gig_id) || null,
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

  const counts = {
    all: rows?.length || 0,
    Pending: rows?.filter((row) => row.status === 'Pending').length || 0,
    Accepted: rows?.filter((row) => row.status === 'Accepted').length || 0,
    Rejected: rows?.filter((row) => row.status === 'Rejected').length || 0,
  };
  const visible = rows ? rows.filter((row) => filter === 'all' || row.status === filter) : null;

  return (
    <div className="space-y-4">
      <PageHeader title="My applications" subtitle="Every proposal you sent, and where it stands." />
      <Tabs
        label="Application status"
        value={filter}
        onChange={setFilter}
        tabs={FILTERS.map((item) => ({ ...item, count: counts[item.id] }))}
      />
      <Alert>{error}</Alert>
      {visible === null && !error ? <Loading>Loading applications…</Loading> : null}
      {visible && visible.length === 0 && !error ? (
        <Empty>
          Nothing in this list yet.{' '}
          <Link to={`/${section}`} className={`${textLinkClass} inline-flex min-h-11 items-center`}>Keep browsing</Link>
        </Empty>
      ) : null}
      {visible && visible.length > 0 ? (
        <ul className="space-y-3">
          {visible.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ApplicationCard({ application }) {
  const gig = application.gig;
  const accepted = application.status === 'Accepted';
  const rejected = application.status === 'Rejected';
  const shell = accepted
    ? 'border-success-line bg-success-soft'
    : rejected
      ? 'border-line bg-canvas'
      : 'border-line bg-surface';
  return (
    <li className={`min-w-0 space-y-3 rounded-3xl border p-4 shadow-card ${shell}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link to={`/gigs/${application.gig_id}`} className={`${textLinkClass} inline-flex min-h-11 min-w-0 items-center break-words font-display text-lg`}>
          {gig?.title || 'Untitled gig'}
        </Link>
        {gig ? <Badge tone={statusTone(gig.status)}>{gig.status}</Badge> : null}
      </div>
      <StatusTracker status={application.status} />
      {accepted ? <p className="text-base font-semibold text-success">You were selected!</p> : null}
      {rejected && application.rejection_note ? <p className="text-base text-ink">{application.rejection_note}</p> : null}
      {rejected && !application.rejection_note && wasAutoRejected(application, gig) ? (
        <p className="text-base text-muted">Another applicant was selected for this gig.</p>
      ) : null}
      <p className="break-words text-base text-secondary">{application.message}</p>
      <p className="text-sm text-muted">Submitted {formatWhen(application.created_at)}</p>
      {accepted && gig?.accepted_applicant_id ? (
        <Link to={`/gigs/${application.gig_id}#chat`} className={`${textLinkClass} inline-flex min-h-11 items-center`}>Open chat</Link>
      ) : null}
      {accepted && gig?.status === 'Completed' ? (
        <Link to={`/gigs/${application.gig_id}`} className={`${textLinkClass} inline-flex min-h-11 items-center`}>Leave a review</Link>
      ) : null}
      {accepted && gig && gig.status !== 'Completed' ? (
        <Link to={`/gigs/${application.gig_id}`} className={`${textLinkClass} inline-flex min-h-11 items-center`}>Open the gig</Link>
      ) : null}
    </li>
  );
}
