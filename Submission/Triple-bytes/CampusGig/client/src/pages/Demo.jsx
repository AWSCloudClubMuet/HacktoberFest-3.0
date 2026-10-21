import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUsers, login as loginRequest } from '../api/index.js';
import { useUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { DEMO_PASSWORD, demoEmail, isDemoUser } from '../utils/demo.js';
import { initials } from '../utils/formatters.js';

export default function Demo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, login } = useUser();
  const [users, setUsers] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loggingInId, setLoggingInId] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setFailed(false);
    getUsers()
      .then((list) => !ignore && setUsers(list.filter(isDemoUser)))
      .catch((err) => {
        if (ignore) return;
        setFailed(true);
        toast.error(err);
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  async function loginAs(user) {
    setLoggingInId(user.id);
    try {
      const session = await loginRequest({ email: demoEmail(user.name), password: DEMO_PASSWORD });
      login(session);
      toast.show(t('auth.welcomeBack', { name: user.name.split(' ')[0] }));
      navigate('/');
    } catch (err) {
      toast.error(err);
      setLoggingInId(null);
    }
  }

  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">{t('demo.eyebrow')}</div>
          <h2>{t('demo.title')}</h2>
          <p>{t('demo.sub')}</p>
        </div>
      </div>

      <div className="notice demobanner">
        <span>{t('demo.passwordLabel')}</span>
        <code dir="ltr">{DEMO_PASSWORD}</code>
      </div>

      {failed && (
        <div className="empty">
          <button className="btn light small" onClick={() => setAttempt((n) => n + 1)}>
            {t('common.retry')}
          </button>
        </div>
      )}

      <div className="demogrid">
        {!users &&
          !failed &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="panel democard" aria-hidden="true">
              <div className="skeleton" style={{ height: 120 }} />
            </div>
          ))}

        {users?.map((user) => {
          const isCurrent = currentUser?.id === user.id;
          return (
            <article className={`panel democard${isCurrent ? ' current' : ''}`} key={user.id}>
              <div className="person">
                <div className="avatar">{initials(user.name)}</div>
                <div>
                  <div className="person-name">{user.name}</div>
                  <div className="person-meta">
                    {user.major} · {t('profile.semester', { n: user.semester })}
                  </div>
                </div>
              </div>

              <div className="demoemail" dir="ltr">
                {demoEmail(user.name)}
              </div>

              <button
                type="button"
                className={`btn small${isCurrent ? ' light' : ''}`}
                style={{ width: '100%' }}
                disabled={isCurrent || loggingInId !== null}
                onClick={() => loginAs(user)}
              >
                {isCurrent
                  ? t('demo.current')
                  : loggingInId === user.id
                    ? t('auth.loggingIn')
                    : t('demo.loginAs', { name: user.name.split(' ')[0] })}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
