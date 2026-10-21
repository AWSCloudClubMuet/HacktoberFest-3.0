import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getGigApplications, decideApplication } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { initials } from '../utils/formatters.js';
import { Stars } from './StarRating.jsx';

const APP_TAG = { Pending: 'blue', Accepted: '', Rejected: 'grey' };

export default function ApplicantList({ gigId, gigStatus, onChanged }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [apps, setApps] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setApps(await getGigApplications(gigId));
    } catch (err) {
      toast.error(err);
      setApps((prev) => prev ?? []);
    }
  }, [gigId]);

  useEffect(() => {
    load();
  }, [load, gigStatus]);

  async function decide(app, status) {
    setBusyId(app.id);
    try {
      const result = await decideApplication(app.id, status);
      toast.show(status === 'Accepted' ? t('applicants.acceptedMsg') : t('applicants.rejectedMsg'));
      setApps((prev) =>
        prev.map((a) =>
          a.id === app.id ? { ...a, status } : status === 'Accepted' && a.status === 'Pending' ? { ...a, status: 'Rejected' } : a,
        ),
      );
      setBusyId(null);
      onChanged?.(result.gig);
      load();
    } catch (err) {
      toast.error(err);
      setBusyId(null);
      load();
      onChanged?.();
    }
  }

  if (!apps) {
    return (
      <div>
        {[0, 1].map((i) => (
          <div key={i} className="skeleton" style={{ height: 78, marginBottom: 10 }} />
        ))}
      </div>
    );
  }

  if (apps.length === 0) return <div className="notice closed">{t('applicants.none')}</div>;

  return (
    <div className="applist">
      {apps.map((a) => (
        <div className="appitem" key={a.id}>
          <div className="appitem-top">
            <Link to={`/profile/${a.applicant.id}`} className="person">
              <div className="avatar">{initials(a.applicant.name)}</div>
              <div>
                <div className="person-name">{a.applicant.name}</div>
                <div className="person-meta">{a.applicant.major}</div>
              </div>
            </Link>
            <span className={`tag ${APP_TAG[a.status] || ''}`}>{t(`appStatus.${a.status}`)}</span>
          </div>

          <p className="appmsg">{a.message}</p>

          <div className="appitem-foot">
            <span className="skill" dir="auto">
              {a.applicant.average_rating != null ? (
                <>
                  <Stars value={a.applicant.average_rating} /> {a.applicant.average_rating}
                </>
              ) : (
                t('applicants.noRating')
              )}
            </span>

            {gigStatus === 'Open' && a.status === 'Pending' && (
              <span className="appactions">
                <button className="btn small" disabled={busyId === a.id} onClick={() => decide(a, 'Accepted')}>
                  {t('applicants.accept')}
                </button>
                <button className="btn light small" disabled={busyId === a.id} onClick={() => decide(a, 'Rejected')}>
                  {t('applicants.reject')}
                </button>
              </span>
            )}
          </div>

          {a.applicant.skills?.length > 0 && (
            <div className="skills" style={{ marginTop: 10, marginBottom: 0 }}>
              {a.applicant.skills.map((s) => (
                <span className="skill" key={s}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
