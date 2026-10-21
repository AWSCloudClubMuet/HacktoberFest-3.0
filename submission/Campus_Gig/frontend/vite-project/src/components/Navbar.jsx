import { Link, NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { currentUser, logout } = useUser();
  const navigate = useNavigate();

  const handleSwitch = () => {
    logout();
    navigate("/welcome");
  };

  const navLinkClass = ({ isActive }) =>
    `campus-nav-link${isActive ? " active" : ""}`;

  return (
    <header className="campus-navbar-wrapper">
      <nav className="campus-navbar" aria-label="Main navigation">
        <Link to="/" className="campus-brand" aria-label="Campus Gig home">
          <span className="campus-brand-mark" aria-hidden="true">
            cg
          </span>
          <span className="campus-brand-name">Campus Gig</span>
        </Link>

        <div className="campus-nav-links">
          <NavLink to="/" end className={navLinkClass}>
            Browse Gigs
          </NavLink>

          {currentUser && (
            <>
              <NavLink to="/gigs/new" className={navLinkClass}>
                Post a Gig
              </NavLink>

              <NavLink to="/applications" className={navLinkClass}>
                My Applications
              </NavLink>

              <NavLink
                to={`/profile/${currentUser.id}`}
                className={navLinkClass}
              >
                My Profile
              </NavLink>
            </>
          )}
        </div>

        <div className="campus-nav-actions">
          {currentUser ? (
            <>
              <span className="campus-nav-user" title={currentUser.name}>
                {currentUser.name}
              </span>

              <button
                type="button"
                className="campus-nav-cta campus-nav-cta--secondary"
                onClick={handleSwitch}
              >
                Switch user
              </button>
            </>
          ) : (
            <Link to="/welcome" className="campus-nav-cta">
              Get started <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
