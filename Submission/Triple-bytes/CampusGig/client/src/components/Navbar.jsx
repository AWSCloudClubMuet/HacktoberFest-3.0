import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { initials } from '../utils/formatters.js';
import LangToggle from './LangToggle.jsx';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser, logout } = useUser();

  const demoLink = { to: '/demo', label: t('nav.demo') };
  const navLinks = currentUser
    ? [
        { to: '/', label: t('nav.explore'), end: true },
        { to: '/my-gigs', label: t('nav.myGigs') },
        { to: '/my-applications', label: t('nav.myApplications') },
        { to: `/profile/${currentUser.id}`, label: t('nav.profile') },
        demoLink,
      ]
    : [demoLink];

  function handleLogout() {
    logout();
    navigate('/login');
    toast.show(t('auth.loggedOut'));
  }

  return (
    <header className="topbar">
      <div className="wrap nav">
        <Link className="brand" to="/">
          <span className="mark">
            <span className="arrow">↗</span>
          </span>
          <span dir="ltr">
            campusgig<span className="dotmark">.</span>
          </span>
        </Link>

        <nav className="links">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navright">
          <LangToggle />
          {currentUser ? (
            <>
              <Link className="userchip" to={`/profile/${currentUser.id}`}>
                <div className="avatar">{initials(currentUser.name)}</div>
                <span>{currentUser.name.split(' ')[0]}</span>
              </Link>
              <Link className="btn small" to="/gigs/new">
                {t('nav.postGig')}
              </Link>
              <button type="button" className="btn light small logoutbtn" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link className="btn light small" to="/login">
                {t('nav.login')}
              </Link>
              <Link className="btn small" to="/signup">
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="mobilelinks">
        {navLinks.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
        {currentUser && (
          <button type="button" className="linkbtn" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        )}
      </nav>
    </header>
  );
}
