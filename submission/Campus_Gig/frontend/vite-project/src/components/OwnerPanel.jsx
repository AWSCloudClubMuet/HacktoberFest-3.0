import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { formatDateTime } from "../utils";
import StatusBadge from "./StatusBadge";

export default function OwnerPanel({ gig, onGigChanged }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadApplications = useCallback(async () => {
    try {
      setApplications(await api.gigApplications(gig.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gig.id]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // runs one action, then ALWAYS reloads from the server (the server is the truth,
  // for example the gig may have just expired)
  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    }
    await loadApplications();
    await onGigChanged();
    setBusy(false);
  };

  const handleDecision = (application, status) => {
    if (
      status === "Accepted" &&
      !window.confirm(
        `Accept ${application.applicant.name}? All other pending applications will be rejected.`,
      )
    ) {
      return;
    }
    run(() => api.updateApplication(application.id, status));
  };

  const handleGigStatus = (status, question) => {
    if (!window.confirm(question)) return;
    run(() => api.updateGigStatus(gig.id, status));
  };

  const canCancel = gig.status === "Open" || gig.status === "In Progress";

  return (
    <div>
      <p>
        You are the <strong>Poster</strong> of this gig.
      </p>

      {error && <div className="alert">{error}</div>}

      {gig.status === "In Progress" && (
        <div className="notice">
          <span>
            Work is in progress
            {gig.accepted_applicant
              ? ` with ${gig.accepted_applicant.name}`
              : ""}
            .
          </span>
          <button
            className="btn btn-small"
            disabled={busy}
            onClick={() =>
              handleGigStatus("Completed", "Mark this gig as completed?")
            }
          >
            Mark as Completed
          </button>
        </div>
      )}

      {gig.status === "Completed" && (
        <div className="notice">This gig is completed.</div>
      )}

      <h3>Applications ({applications.length})</h3>
      {loading && <p className="muted">Loading applications...</p>}
      {!loading && applications.length === 0 && (
        <p className="muted">No applications yet.</p>
      )}

      {applications.map((app) => (
        <div className="applicant" key={app.id}>
          <div className="applicant-head">
            <div>
              <Link to={`/profile/${app.applicant.id}`}>
                <strong>{app.applicant.name}</strong>
              </Link>
              <div className="muted small">
                {app.applicant.major} · Semester {app.applicant.semester}
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>

          {app.applicant.skills.length > 0 && (
            <div className="badges">
              {app.applicant.skills.map((skill) => (
                <span className="badge badge-skill" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          <p className="pre-wrap">{app.message}</p>
          <p className="muted small">
            Applied {formatDateTime(app.created_at)}
          </p>

          {app.status === "Pending" && gig.status === "Open" && (
            <div className="actions">
              <button
                className="btn btn-small"
                disabled={busy}
                onClick={() => handleDecision(app, "Accepted")}
              >
                Accept
              </button>
              <button
                className="btn btn-small btn-outline"
                disabled={busy}
                onClick={() => handleDecision(app, "Rejected")}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}

      {canCancel && (
        <div className="danger-zone">
          <button
            className="btn btn-small btn-danger"
            disabled={busy}
            onClick={() =>
              handleGigStatus(
                "Cancelled",
                "Cancel this gig? Pending applications will be rejected. This cannot be undone.",
              )
            }
          >
            Cancel gig
          </button>
        </div>
      )}
    </div>
  );
}
