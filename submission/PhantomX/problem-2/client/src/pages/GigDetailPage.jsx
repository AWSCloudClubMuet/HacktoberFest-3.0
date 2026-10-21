import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { paymentLabel } from '../constants.js';
import { formatMoney, formatWhen } from '../format.js';
import { Alert, Badge, Field, Link, Loading, Notice, buttonClass, inputClass, statusTone } from '../components.jsx';

export function GigDetailPage({ gigId }) {
  const { userId } = useApp();
  const [gig, setGig] = useState(null);
  const [poster, setPoster] = useState(null);
  const [application, setApplication] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api(`/gigs/${encodeURIComponent(gigId)}`)
      .then(async (nextGig) => {
        const [nextPoster, mine] = await Promise.all([
          api(`/users/${encodeURIComponent(nextGig.user_id)}`),
          api(`/applications?gig_id=${encodeURIComponent(nextGig.id)}&applicant_id=${encodeURIComponent(userId)}`),
        ]);
        if (cancelled) return;
        setGig(nextGig);
        setPoster(nextPoster);
        setApplication(mine[0] || null);
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
  }, [gigId, userId]);

  async function onApply(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setFieldError('message is required');
      setFormError('');
      setNotice('');
      return;
    }
    if (trimmed.length > 500) {
      setFieldError('message must be 500 characters or fewer');
      setFormError('');
      setNotice('');
      return;
    }
    setSaving(true);
    setFieldError('');
    setFormError('');
    setNotice('');
    try {
      const created = await api('/applications', {
        method: 'POST',
        body: { gig_id: gig.id, message: trimmed },
      });
      setApplication(created);
      setNotice(`Application sent. Status: ${created.status}.`);
      setMessage('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading>Loading gig…</Loading>;
  if (error) return <Alert>{error}</Alert>;
  if (!gig) return <Alert>Gig not found</Alert>;

  const isOwner = gig.user_id === userId;
  const canApply = gig.status === 'Open';

  return (
    <div className="space-y-5">
      <Link to="/" className="text-sm font-medium text-teal-800 hover:underline">Back to gigs</Link>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
            <Badge tone={gig.type === 'Offering' ? 'offering' : 'requesting'}>{gig.type}</Badge>
            <Badge tone="neutral">{gig.category}</Badge>
          </div>
          <h1 className="text-2xl font-semibold text-stone-900">{gig.title}</h1>
          <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{gig.description}</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Payment</dt>
              <dd className="font-medium">
                {paymentLabel(gig.payment_type)}
                {gig.payment_type === 'Paid' && gig.budget != null ? ` · ${formatMoney(gig.budget)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Deadline</dt>
              <dd className="font-medium">{formatWhen(gig.deadline)}</dd>
            </div>
          </dl>
        </article>

        <aside className="space-y-4">
          <section className="rounded-xl border border-stone-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-900">Posted by</h2>
            {poster ? (
              <div className="mt-2 space-y-2 text-sm">
                <Link to={`/users/${poster.id}`} className="font-medium text-teal-800 hover:underline">{poster.name}</Link>
                <p className="text-stone-600">{poster.major} · Semester {poster.semester}</p>
                <p className="text-stone-600">{poster.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {poster.skills.map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)}
                </div>
                <p className="text-stone-500">
                  {poster.gigs_posted} posted · {poster.gigs_completed} completed · {poster.average_rating == null ? 'No reviews yet' : `${poster.average_rating} average`}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-500">Poster details are unavailable.</p>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-900">Apply</h2>
            {application ? (
              <p className="text-sm text-stone-600">
                Your application is <Badge tone={statusTone(application.status)}>{application.status}</Badge>
              </p>
            ) : null}
            {canApply ? (
              <form className="space-y-3" noValidate onSubmit={onApply}>
                {isOwner ? (
                  <p className="text-sm text-stone-600">You posted this gig. The server will reject an application from the owner.</p>
                ) : null}
                <Alert>{formError}</Alert>
                <Field label="Message" error={fieldError}>
                  <textarea
                    className={inputClass}
                    rows="4"
                    maxLength={500}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Say how you can help"
                  />
                </Field>
                <button className={buttonClass} type="submit" disabled={saving}>
                  {saving ? 'Sending…' : 'Apply'}
                </button>
                <Notice>{notice}</Notice>
              </form>
            ) : (
              <p className="text-sm text-stone-600">This gig is {gig.status}, so new applications are closed.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
