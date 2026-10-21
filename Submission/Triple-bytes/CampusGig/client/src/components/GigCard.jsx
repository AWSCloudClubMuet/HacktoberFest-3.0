import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORY_TAG, STATUS_TAG } from '../utils/constants.js';
import { initials, formatBudget, daysSince, formatDate } from '../utils/formatters.js';
import { useLang } from '../context/LangContext.jsx';

export default function GigCard({ gig }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const days = daysSince(gig.created_at);
  const budget = formatBudget(gig);

  return (
    <article className={`gig${gig.status === 'Expired' ? ' expired' : ''}`}>
      <div className="gig-top">
        <span className={`tag ${gig.type === 'Requesting' ? 'request' : ''}`}>{t(`typeTag.${gig.type}`)}</span>
        <span className={`tag ${STATUS_TAG[gig.status] || ''}`}>{t(`status.${gig.status}`)}</span>
      </div>

      <h3>{gig.title}</h3>
      <p className="gig-desc">{gig.description.length > 140 ? `${gig.description.slice(0, 140)}…` : gig.description}</p>

      <div className="gig-top" style={{ justifyContent: 'flex-start', gap: 7, marginBottom: 12 }}>
        <span className={`tag ${CATEGORY_TAG[gig.category] || ''}`}>{t(`category.${gig.category}`)}</span>
        <span className={`tag ${gig.payment_type === 'Paid' ? '' : 'blue'}`}>{t(`payTag.${gig.payment_type}`)}</span>
      </div>

      <div className="skills">
        <span className="skill">{t('gig.due', { date: formatDate(gig.deadline, lang) })}</span>
        <span className="skill">{t('gig.applicants', { count: gig.applications_count })}</span>
      </div>

      <div className="gig-foot">
        <div className="person">
          <div className="avatar">{initials(gig.owner?.name)}</div>
          <div>
            <div className="person-name">{gig.owner?.name}</div>
            <div className="person-meta">{gig.owner?.major}</div>
          </div>
        </div>
        <div className="price">
          {budget || t(`payment.${gig.payment_type}`)}
          <small>· {days === 0 ? t('gig.today') : t('gig.daysAgo', { count: days })}</small>
        </div>
      </div>

      <Link className="btn light small" to={`/gigs/${gig.id}`} style={{ width: '100%', marginTop: 15 }}>
        {t('gig.view')} <span className="arrow">↗</span>
      </Link>
    </article>
  );
}

export function GigCardSkeleton() {
  return (
    <article className="gig skel" aria-hidden="true">
      <div className="skeleton" style={{ height: 20, width: '40%' }} />
      <div className="skeleton" style={{ height: 22, width: '85%', margin: '18px 0 10px' }} />
      <div className="skeleton" style={{ height: 12, width: '100%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 22 }} />
      <div className="skeleton" style={{ height: 30, width: '100%' }} />
    </article>
  );
}
