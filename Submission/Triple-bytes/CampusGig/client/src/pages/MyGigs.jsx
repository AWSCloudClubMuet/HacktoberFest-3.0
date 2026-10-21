import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGigs } from '../api/index.js';
import { useUser } from '../context/UserContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ApplicantList from '../components/ApplicantList.jsx';
import GigStatusControls from '../components/GigStatusControls.jsx';
import { GigCardSkeleton } from '../components/GigCard.jsx';
import { CATEGORY_TAG, STATUS_TAG } from '../utils/constants.js';
import { formatBudget, formatDate } from '../utils/formatters.js';

export default function MyGigs() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const toast = useToast();
  const { currentUser } = useUser();
  const [gigs, setGigs] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      setGigs(await getGigs({ user_id: currentUser.id }));
    } catch (err) {
      toast.error(err);
      setGigs((prev) => prev ?? []);
    }
  }, [currentUser.id]);

  useEffect(() => {
    load();
  }, [load]);

  const patchGig = (changes) => {
    if (changes?.id && changes.status) {
      setGigs((list) => list && list.map((g) => (g.id === changes.id ? { ...g, status: changes.status } : g)));
    }
    load();
  };

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">{t('nav.myGigs')}</div>
          <h2>{t('myGigs.title')}</h2>
          <p>{t('myGigs.sub')}</p>
        </div>
        <Link className="btn small" to="/gigs/new">
          {t('nav.postGig')}
        </Link>
      </div>

      {!gigs && (
        <div className="rowlist">
          <GigCardSkeleton />
          <GigCardSkeleton />
        </div>
      )}

      {gigs?.length === 0 && (
        <div className="empty">
          {t('myGigs.empty')}
          <br />
          <Link className="btn light small" to="/gigs/new" style={{ marginTop: 13 }}>
            {t('myGigs.emptyCta')}
          </Link>
        </div>
      )}

      <div className="rowlist">
        {gigs?.map((g) => {
          const budget = formatBudget(g);
          const expanded = openId === g.id;
          return (
            <article className={`panel rowcard${g.status === 'Expired' ? ' expired' : ''}`} key={g.id}>
              <div className="gig-top" style={{ justifyContent: 'flex-start', gap: 7 }}>
                <span className={`tag ${g.type === 'Requesting' ? 'request' : ''}`}>{t(`typeTag.${g.type}`)}</span>
                <span className={`tag ${CATEGORY_TAG[g.category] || ''}`}>{t(`category.${g.category}`)}</span>
                <span className={`tag ${STATUS_TAG[g.status] || ''}`}>{t(`status.${g.status}`)}</span>
              </div>

              <h3 className="rowtitle">
                <Link to={`/gigs/${g.id}`}>{g.title}</Link>
              </h3>

              <div className="skills">
                <span className="skill">{budget || t(`payment.${g.payment_type}`)}</span>
                <span className="skill">{t('gig.due', { date: formatDate(g.deadline, lang) })}</span>
                <span className="skill">{t('gig.applicants', { count: g.applications_count })}</span>
              </div>

              <div className="rowactions">
                <Link className="btn light small" to={`/gigs/${g.id}`}>
                  {t('myGigs.view')}
                </Link>
                <button className="btn light small" onClick={() => setOpenId(expanded ? null : g.id)}>
                  {expanded ? t('myGigs.hideApplicants') : t('myGigs.viewApplicants')}
                </button>
                <GigStatusControls gig={g} onChanged={patchGig} />
              </div>

              {expanded && (
                <div style={{ marginTop: 18 }}>
                  <ApplicantList gigId={g.id} gigStatus={g.status} onChanged={patchGig} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
