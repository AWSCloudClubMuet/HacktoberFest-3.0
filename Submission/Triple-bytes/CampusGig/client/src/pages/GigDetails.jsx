import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGig } from '../api/index.js';
import { errorCode } from '../api/client.js';
import { useUser } from '../context/UserContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ApplyForm from '../components/ApplyForm.jsx';
import ApplicantList from '../components/ApplicantList.jsx';
import GigStatusControls from '../components/GigStatusControls.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import { CATEGORY_TAG, STATUS_TAG } from '../utils/constants.js';
import { initials, formatBudget, formatDate } from '../utils/formatters.js';

export default function GigDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { lang } = useLang();
  const toast = useToast();
  const { currentUser } = useUser();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      setGig(await getGig(id));
      setNotFound(false);
    } catch (err) {
      if (errorCode(err) === 'GIG_NOT_FOUND') setNotFound(true);
      else toast.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setGig(null);
    load();
    window.scrollTo(0, 0);
  }, [load]);

  const patchGig = (changes) => {
    if (changes?.status) {
      setGig((g) => g && { ...g, status: changes.status, accepted_applicant_id: changes.accepted_applicant_id ?? g.accepted_applicant_id });
    }
    load();
  };
  const onApplied = (application) => {
    if (application) {
      setGig((g) => g && { ...g, my_application: { id: application.id, status: application.status }, applications_count: g.applications_count + 1 });
    }
    load();
  };
  const onReviewed = (review) => {
    if (review) setGig((g) => g && { ...g, my_review: review });
    load();
  };

  if (loading) {
    return (
      <div className="wrap section">
        <div className="details">
          <div className="panel">
            <div className="skeleton" style={{ height: 22, width: '30%' }} />
            <div className="skeleton" style={{ height: 34, width: '80%', margin: '20px 0' }} />
            <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
          </div>
          <div className="panel">
            <div className="skeleton" style={{ height: 120 }} />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !gig) {
    return (
      <div className="wrap pagemsg">
        <h1>{t('details.notFound')}</h1>
        <Link className="btn" to="/">
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  const isOwner = gig.user_id === currentUser.id;
  const isAccepted = gig.accepted_applicant?.id === currentUser.id;
  const canReview = gig.status === 'Completed' && (isOwner || isAccepted);
  const revieweeName = isOwner ? gig.accepted_applicant?.name : gig.owner.name;
  const budget = formatBudget(gig);

  return (
    <div className="wrap section" style={{ paddingTop: 34 }}>
      <Link className="backlink" to="/">
        <span className="arrow" style={{ transform: lang === 'ur' ? 'none' : 'scaleX(-1)' }}>
          ↗
        </span>
        {t('details.back')}
      </Link>

      <div className="details">
        <div>
          <article className="panel">
            <div className="tags">
              <span className={`tag ${gig.type === 'Requesting' ? 'request' : ''}`}>{t(`typeTag.${gig.type}`)}</span>
              <span className={`tag ${CATEGORY_TAG[gig.category] || ''}`}>{t(`category.${gig.category}`)}</span>
              <span className={`tag ${gig.payment_type === 'Paid' ? '' : 'blue'}`}>{t(`payTag.${gig.payment_type}`)}</span>
              <span className={`tag ${STATUS_TAG[gig.status] || ''}`}>{t(`status.${gig.status}`)}</span>
            </div>

            <h1>{gig.title}</h1>
            <h2>{t('details.about')}</h2>
            <p className="body">{gig.description}</p>

            <div className="metagrid">
              <div className="meta">
                <small>{t('details.category')}</small>
                <strong>{t(`category.${gig.category}`)}</strong>
              </div>
              <div className="meta">
                <small>{t('details.payment')}</small>
                <strong>{t(`payment.${gig.payment_type}`)}</strong>
              </div>
              <div className="meta">
                <small>{t('details.budget')}</small>
                <strong>{budget || t('details.noBudget')}</strong>
              </div>
              <div className="meta">
                <small>{t('details.deadline')}</small>
                <strong>{formatDate(gig.deadline, lang)}</strong>
              </div>
              <div className="meta">
                <small>{t('details.posted')}</small>
                <strong>{formatDate(gig.created_at.slice(0, 10), lang)}</strong>
              </div>
              <div className="meta">
                <small>{t('details.applicants')}</small>
                <strong>{gig.applications_count}</strong>
              </div>
            </div>
          </article>

          {isOwner && (
            <section className="panel">
              <h2>{t('applicants.title')}</h2>
              <ApplicantList gigId={gig.id} gigStatus={gig.status} onChanged={patchGig} />
            </section>
          )}

          {canReview && (
            <section className="panel">
              <ReviewForm
                gigId={gig.id}
                revieweeName={revieweeName}
                myReview={gig.my_review}
                onDone={onReviewed}
              />
            </section>
          )}
        </div>

        <aside className="sidecol">
          <div className="panel">
            <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('details.postedBy')}</small>
            <Link
              to={`/profile/${gig.owner.id}`}
              className="person"
              style={{ marginTop: 10 }}
            >
              <div className="avatar">{initials(gig.owner.name)}</div>
              <div>
                <div className="person-name">{gig.owner.name}</div>
                <div className="person-meta">{gig.owner.major}</div>
              </div>
            </Link>

            {gig.accepted_applicant && (
              <div style={{ marginTop: 18 }}>
                <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('details.workingWith')}</small>
                <Link to={`/profile/${gig.accepted_applicant.id}`} className="person" style={{ marginTop: 10 }}>
                  <div className="avatar">{initials(gig.accepted_applicant.name)}</div>
                  <div className="person-name">{gig.accepted_applicant.name}</div>
                </Link>
              </div>
            )}
          </div>

          <div className="panel">
            <h2>{isOwner ? t('details.manageTitle') : t('details.applyTitle')}</h2>
            {isOwner ? (
              <>
                <div className="notice">{t('details.ownGig')}</div>
                <div style={{ marginTop: 14 }}>
                  <GigStatusControls gig={gig} onChanged={patchGig} />
                </div>
              </>
            ) : gig.my_application ? (
              <div className="notice">
                <div className="statusline">
                  <strong>{t('details.applied')}</strong>
                </div>
                <div className="statusline" style={{ marginTop: 8 }}>
                  <span>{t('details.yourStatus')}</span>
                  <span
                    className={`tag ${
                      gig.my_application.status === 'Accepted' ? '' : gig.my_application.status === 'Rejected' ? 'grey' : 'blue'
                    }`}
                  >
                    {t(`appStatus.${gig.my_application.status}`)}
                  </span>
                </div>
              </div>
            ) : gig.status !== 'Open' ? (
              <div className="notice closed">{t('details.closed')}</div>
            ) : (
              <ApplyForm gigId={gig.id} onApplied={onApplied} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
