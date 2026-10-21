import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplications } from '../api/index.js';
import { useUser } from '../context/UserContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { GigCardSkeleton } from '../components/GigCard.jsx';
import { CATEGORY_TAG, STATUS_TAG } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';

const APP_TAG = { Pending: 'blue', Accepted: '', Rejected: 'grey' };

export default function MyApplications() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const toast = useToast();
  const { currentUser } = useUser();
  const [apps, setApps] = useState(null);

  useEffect(() => {
    let ignore = false;
    getApplications({ applicant_id: currentUser.id })
      .then((data) => !ignore && setApps(data))
      .catch((err) => {
        if (ignore) return;
        toast.error(err);
        setApps([]);
      });
    return () => {
      ignore = true;
    };
  }, [currentUser.id]);

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">{t('nav.myApplications')}</div>
          <h2>{t('myApps.title')}</h2>
          <p>{t('myApps.sub')}</p>
        </div>
      </div>

      {!apps && (
        <div className="rowlist">
          <GigCardSkeleton />
          <GigCardSkeleton />
        </div>
      )}

      {apps?.length === 0 && (
        <div className="empty">
          {t('myApps.empty')}
          <br />
          <Link className="btn light small" to="/" style={{ marginTop: 13 }}>
            {t('myApps.browse')}
          </Link>
        </div>
      )}

      <div className="rowlist">
        {apps?.map((a) => (
          <article className="panel rowcard" key={a.id}>
            <div className="gig-top">
              <div className="gig-top" style={{ gap: 7 }}>
                <span className={`tag ${CATEGORY_TAG[a.gig?.category] || ''}`}>{t(`category.${a.gig?.category}`)}</span>
                <span className={`tag ${STATUS_TAG[a.gig?.status] || ''}`}>{t(`status.${a.gig?.status}`)}</span>
              </div>
              <span className={`tag ${APP_TAG[a.status] || ''}`}>{t(`appStatus.${a.status}`)}</span>
            </div>

            <h3 className="rowtitle">
              <Link to={`/gigs/${a.gig_id}`}>{a.gig?.title}</Link>
            </h3>

            <small style={{ color: 'var(--muted)', fontSize: 11 }}>{t('myApps.yourMessage')}</small>
            <p className="appmsg">{a.message}</p>

            <div className="gig-foot" style={{ marginTop: 14 }}>
              <span className="person-meta">{t('myApps.appliedOn', { date: formatDate(a.created_at.slice(0, 10), lang) })}</span>
              <Link className="btn light small" to={`/gigs/${a.gig_id}`}>
                {t('gig.view')} <span className="arrow">↗</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
