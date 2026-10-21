import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge";
import { formatDate, formatDateTime } from "../utils";
import "../styles/MyApplicationPage.css";
export default function MyApplicationPage() {
  const [state, setState] = useState({
    loading: true,
    applications: [],
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    api
      .myApplications()
      .then((applications) => {
        if (!cancelled) {
          setState({ loading: false, applications, error: "" });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            applications: [],
            error: err.message,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <main className="my-applications-page">
        <div className="applications-state">
          <span className="applications-spinner" />
          <p>Loading your applications...</p>
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="my-applications-page">
        <div className="applications-error" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>We couldn't load your applications</strong>
            <p>{state.error}</p>
          </div>
        </div>
      </main>
    );
  }

  const applications = state.applications;
  const pendingCount = applications.filter(
    (app) => app.status === "Pending",
  ).length;
  const acceptedCount = applications.filter(
    (app) => app.status === "Accepted",
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status === "Rejected",
  ).length;
  const completedCount = applications.filter(
    (app) => app.gig?.status === "Completed",
  ).length;

  return (
    <main className="my-applications-page">
      <section className="applications-hero">
        <div className="applications-hero-copy">
          <span className="applications-eyebrow">
            <span className="applications-eyebrow-dot" />
            YOUR CAMPUS OPPORTUNITIES
          </span>

          <h1>
            Your applications.
            <br />
            <span>Your next opportunity.</span>
          </h1>

          <p>
            Keep track of the gigs you've applied for, follow decisions, and see
            how your collaborations are progressing.
          </p>
        </div>

        <div className="applications-hero-art" aria-hidden="true">
          <div className="applications-orbit applications-orbit-outer" />
          <div className="applications-orbit applications-orbit-inner" />
          <div className="applications-art-icon">✓</div>
          <span className="applications-art-chip applications-art-chip-one">
            ↗
          </span>
          <span className="applications-art-chip applications-art-chip-two">
            ✦
          </span>
        </div>
      </section>

      <section className="applications-overview">
        <div className="applications-section-heading">
          <div>
            <span className="applications-section-kicker">
              APPLICATION OVERVIEW
            </span>
            <h2>My applications</h2>
            <p>Your submissions and their latest statuses.</p>
          </div>

          <Link to="/" className="applications-browse-button">
            Explore more gigs <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="applications-stats">
          <article className="applications-stat applications-stat-total">
            <div className="applications-stat-icon">▤</div>
            <div>
              <span>Total applications</span>
              <strong>{applications.length}</strong>
            </div>
          </article>

          <article className="applications-stat">
            <div className="applications-stat-icon applications-icon-pending">
              ◷
            </div>
            <div>
              <span>Pending review</span>
              <strong>{pendingCount}</strong>
            </div>
          </article>

          <article className="applications-stat">
            <div className="applications-stat-icon applications-icon-accepted">
              ✓
            </div>
            <div>
              <span>Accepted</span>
              <strong>{acceptedCount}</strong>
            </div>
          </article>

          <article className="applications-stat">
            <div className="applications-stat-icon applications-icon-completed">
              ✦
            </div>
            <div>
              <span>Gigs completed</span>
              <strong>{completedCount}</strong>
            </div>
          </article>
        </div>

        {applications.length === 0 ? (
          <div className="applications-empty">
            <div className="applications-empty-icon" aria-hidden="true">
              ↗
            </div>
            <span className="applications-section-kicker">
              YOUR NEXT CHAPTER STARTS HERE
            </span>
            <h3>You haven't applied to any gigs yet.</h3>
            <p>
              Explore student opportunities, find something that matches your
              skills, and send your first application.
            </p>
            <Link to="/" className="applications-empty-button">
              Browse available gigs <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <div className="applications-list-section">
            <div className="applications-list-heading">
              <div>
                <h3>Application history</h3>
                <p>
                  {applications.length}{" "}
                  {applications.length === 1 ? "submission" : "submissions"} in
                  your account
                </p>
              </div>

              <span className="applications-history-label">
                MOST RECENTLY SUBMITTED
              </span>
            </div>

            <div className="applications-grid">
              {applications.map((app) => (
                <article className="application-card" key={app.id}>
                  <div className="application-card-top">
                    <div className="application-card-symbol" aria-hidden="true">
                      {app.gig?.type === "Offering" ? "↗" : "⌕"}
                    </div>

                    <div className="application-status">
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  <h3 className="application-title">
                    <Link to={`/gigs/${app.gig.id}`}>{app.gig.title}</Link>
                  </h3>

                  <div className="application-meta">
                    <div className="application-meta-item">
                      <span>Gig status</span>
                      <StatusBadge status={app.gig.status} />
                    </div>

                    <div className="application-meta-item">
                      <span>Deadline</span>
                      <strong>{formatDate(app.gig.deadline)}</strong>
                    </div>

                    <div className="application-meta-item">
                      <span>Applied on</span>
                      <strong>{formatDateTime(app.created_at)}</strong>
                    </div>
                  </div>

                  <div className="application-message">
                    <span className="application-message-label">
                      YOUR MESSAGE
                    </span>
                    <p className="pre-wrap">
                      {app.message || "No message provided."}
                    </p>
                  </div>

                  <div className="application-card-footer">
                    <span>Application #{app.id}</span>
                    <Link
                      to={`/gigs/${app.gig.id}`}
                      className="application-view-link"
                    >
                      View gig <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
