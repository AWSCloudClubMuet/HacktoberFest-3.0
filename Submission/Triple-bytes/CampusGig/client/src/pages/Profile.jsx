import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser } from '../api/index.js';
import { errorCode } from '../api/client.js';
import { useUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Stars } from '../components/StarRating.jsx';
import { initials } from '../utils/formatters.js';

export default function Profile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setNotFound(false);
    getUser(id)
      .then((p) => !ignore && setProfile(p))
      .catch((err) => {
        if (ignore) return;
        if (errorCode(err) === 'USER_NOT_FOUND') setNotFound(true);
        else toast.error(err);
      })
      .finally(() => !ignore && setLoading(false));
    window.scrollTo(0, 0);
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="wrap section" style={{ paddingTop: 40 }}>
        <div className="panel">
          <div className="skeleton" style={{ height: 64, width: '50%', marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 90 }} />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="wrap pagemsg">
        <h1>{t('profile.notFound')}</h1>
        <Link className="btn" to="/">
          {t('common.backHome')}
        </Link>
      </div>
    );
  }

  const { stats } = profile;
  const isMe = currentUser.id === profile.id;

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <section className="panel profilehead">
        <div className="avatar big">{initials(profile.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{isMe ? t('profile.you') : t('nav.profile')}</div>
          <h1 style={{ margin: '8px 0 4px' }}>{profile.name}</h1>
          <div className="person-meta" style={{ fontSize: 13 }}>
            {profile.major} · {t('profile.semester', { n: profile.semester })}
          </div>
          {profile.bio && <p className="body" style={{ marginTop: 12 }}>{profile.bio}</p>}
          {profile.skills?.length > 0 && (
            <div className="skills" style={{ marginTop: 14, marginBottom: 0 }}>
              {profile.skills.map((s) => (
                <span className="skill" key={s}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="statgrid">
        <div className="panel stat">
          <small>{t('profile.gigsPosted')}</small>
          <strong>{stats.gigs_posted}</strong>
        </div>
        <div className="panel stat">
          <small>{t('profile.gigsCompleted')}</small>
          <strong>{stats.gigs_completed}</strong>
        </div>
        <div className="panel stat">
          <small>{t('profile.avgRating')}</small>
          <strong>
            {stats.average_rating ?? '—'}
            {stats.average_rating != null && <Stars value={stats.average_rating} />}
          </strong>
        </div>
        <div className="panel stat">
          <small>{t('profile.reviewCount')}</small>
          <strong>{stats.review_count}</strong>
        </div>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>{t('profile.reviews')}</h2>
        {profile.reviews.length === 0 && <div className="notice closed">{t('profile.noReviews')}</div>}
        <div className="applist">
          {profile.reviews.map((r) => (
            <div className="appitem" key={r.id}>
              <div className="appitem-top">
                <div className="person">
                  <Link to={`/profile/${r.reviewer.id}`}>
                    <div className="avatar">{initials(r.reviewer.name)}</div>
                  </Link>
                  <div>
                    <Link to={`/profile/${r.reviewer.id}`} className="person-name">
                      {r.reviewer.name}
                    </Link>
                    <div className="person-meta">
                      <Link to={`/gigs/${r.gig_id}`} style={{ color: 'var(--green)' }}>
                        {r.gig_title}
                      </Link>
                    </div>
                  </div>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="appmsg">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
