import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useUser } from "../UserContext";
import "../styles/WelcomePage.css";

export default function WelcomePage() {
  const { login } = useUser();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
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
  }, []);

  const handlePick = async (id) => {
    setError("");
    setSelectedUser(id);

    try {
      await login(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSelectedUser(null);
    }
  };

  return (
    <main className="welcome-page">
      <section className="welcome-hero">
        <div className="welcome-hero-content">
          <span className="welcome-eyebrow">
            <span className="welcome-status-dot" />
            YOUR CAMPUS. YOUR COMMUNITY.
          </span>

          <h1>
            Good to have you
            <br />
            <span>on board.</span>
          </h1>

          <p>
            Connect with students, share your skills, and discover opportunities
            that help you grow. Choose your profile to get started.
          </p>

          <div className="welcome-hero-points">
            <span>
              <span aria-hidden="true">✦</span> Find your people
            </span>
            <span>
              <span aria-hidden="true">↗</span> Build your skills
            </span>
          </div>
        </div>

        <div className="welcome-hero-art" aria-hidden="true">
          <div className="welcome-orbit welcome-orbit-outer" />
          <div className="welcome-orbit welcome-orbit-inner" />
          <div className="welcome-art-center">cg</div>
          <span className="welcome-art-bubble welcome-bubble-one">✦</span>
          <span className="welcome-art-bubble welcome-bubble-two">↗</span>
          <span className="welcome-art-bubble welcome-bubble-three">+</span>
        </div>
      </section>

      <section className="welcome-content">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-section-kicker">STUDENT ACCESS</span>
            <h2>Choose your profile</h2>
            <p>Pick an existing student profile or create your own.</p>
          </div>

          <Link to="/profile/new" className="welcome-create-button">
            <span aria-hidden="true">+</span>
            Create profile
          </Link>
        </div>

        {error && (
          <div className="welcome-error" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="welcome-state">
            <span className="welcome-spinner" />
            <p>Finding student profiles...</p>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="welcome-empty">
            <div className="welcome-empty-icon" aria-hidden="true">
              +
            </div>
            <h3>Be the first to join</h3>
            <p>
              There are no student profiles yet. Create yours to start exploring
              Campus Gig.
            </p>
            <Link to="/profile/new" className="welcome-primary-button">
              Create your profile <span aria-hidden="true">↗</span>
            </Link>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="welcome-directory">
            <div className="welcome-directory-header">
              <div>
                <h3>Student directory</h3>
                <p>Select a profile to continue</p>
              </div>

              <span className="welcome-user-count">
                {users.length} {users.length === 1 ? "student" : "students"}
              </span>
            </div>

            <div className="welcome-user-grid">
              {users.map((user) => {
                const isSelected = selectedUser === user.id;

                return (
                  <article className="welcome-user-card" key={user.id}>
                    <div className="welcome-user-top">
                      <div className="welcome-avatar" aria-hidden="true">
                        {(user.name || "?").trim().charAt(0).toUpperCase()}
                      </div>

                      <span className="welcome-student-label">STUDENT</span>
                    </div>

                    <div className="welcome-user-info">
                      <h4>{user.name}</h4>
                      <p className="welcome-user-major">
                        {user.major || "Major not specified"}
                      </p>
                    </div>

                    <div className="welcome-user-meta">
                      <span className="welcome-meta-icon" aria-hidden="true">
                        ◷
                      </span>
                      Semester {user.semester ?? "—"}
                    </div>

                    <button
                      type="button"
                      className="welcome-continue-button"
                      onClick={() => handlePick(user.id)}
                      disabled={selectedUser !== null}
                    >
                      {isSelected ? (
                        <>
                          Signing in <span className="welcome-button-spinner" />
                        </>
                      ) : (
                        <>
                          Continue as student
                          <span aria-hidden="true">↗</span>
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <footer className="welcome-footer">
        <span className="welcome-footer-mark">cg</span>
        <p>
          Campus Gig <span>·</span> Skills shared, opportunities created.
        </p>
      </footer>
    </main>
  );
}
