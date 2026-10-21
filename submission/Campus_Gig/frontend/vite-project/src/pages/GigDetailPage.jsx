import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import ApplyForm from "../components/ApplyForm";
import OwnerPanel from "../components/OwnerPanel";
import ReviewSection from "../components/ReviewSection";
import StatusBadge from "../components/StatusBadge";
import { useUser } from "../UserContext";
import { formatDate, formatDateTime, paymentLabel } from "../utils";

export default function GigDetailPage() {
  const { id } = useParams();
  return <GigView key={id} id={id} />;
}

function GigView({ id }) {
  const { currentUser } = useUser();
  const userId = currentUser ? currentUser.id : null;

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [myApplication, setMyApplication] = useState(null);
  const [appsReady, setAppsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getGig(id)
      .then((data) => {
        if (!cancelled) setGig(data);
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
  }, [id]);

  // used by the owner panel after every action; keeps the old data if it fails
  const refreshGig = useCallback(async () => {
    try {
      setGig(await api.getGig(id));
    } catch {
      // ignore: the page keeps showing the last known gig
    }
  }, [id]);

  // find out whether the logged-in user already applied to this gig
  useEffect(() => {
    if (userId === null) return;
    let cancelled = false;
    api
      .myApplications()
      .then((list) => {
        if (!cancelled)
          setMyApplication(list.find((a) => a.gig_id === Number(id)) || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAppsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, id]);

  if (loading) return <p className="muted">Loading gig...</p>;
  if (error) return <div className="alert">{error}</div>;

  const isPoster = userId !== null && userId === gig.user_id;
  const applied =
    myApplication && myApplication.applicant_id === userId
      ? myApplication
      : null;
  const showBudget = gig.payment_type === "Paid" && gig.budget !== null;

  return (
    <div className="card">
      <div className="badges">
        <span className="badge badge-type">{gig.type}</span>
        <span className="badge">{gig.category}</span>
        <span className="badge">
          {paymentLabel(gig.payment_type)}
          {showBudget ? ` · ${Number(gig.budget).toLocaleString()}` : ""}
        </span>
        <StatusBadge status={gig.status} />
      </div>

      <h2>{gig.title}</h2>
      <p className="muted small">
        Posted by <Link to={`/profile/${gig.owner.id}`}>{gig.owner.name}</Link>{" "}
        · Deadline: {formatDate(gig.deadline)}
      </p>
      {gig.accepted_applicant && (
        <p className="small">
          Assigned to:{" "}
          <Link to={`/profile/${gig.accepted_applicant.id}`}>
            <strong>{gig.accepted_applicant.name}</strong>
          </Link>
        </p>
      )}
      <p className="pre-wrap">{gig.description}</p>

      <div className="role-box">
        {userId === null && (
          <p>
            <Link to="/welcome">Log in</Link> to apply for this gig.
          </p>
        )}

        {isPoster && <OwnerPanel gig={gig} onGigChanged={refreshGig} />}

        {userId !== null && !isPoster && !appsReady && (
          <p className="muted">Checking your application...</p>
        )}

        {userId !== null && !isPoster && appsReady && applied && (
          <div>
            <p>
              You applied to this gig. Status:{" "}
              <StatusBadge status={applied.status} />
            </p>
            {applied.status === "Accepted" && gig.status === "In Progress" && (
              <p className="success-text">
                You were selected! The poster will mark the gig as completed
                when the work is done.
              </p>
            )}
            {applied.status === "Accepted" && gig.status === "Completed" && (
              <p className="success-text">This gig is completed.</p>
            )}
            <p className="muted small">
              Sent {formatDateTime(applied.created_at)}
            </p>
            <p className="pre-wrap">{applied.message}</p>
          </div>
        )}

        {userId !== null &&
          !isPoster &&
          appsReady &&
          !applied &&
          gig.status !== "Open" && (
            <p>
              This gig is not accepting applications (status: {gig.status}).
            </p>
          )}

        {userId !== null &&
          !isPoster &&
          appsReady &&
          !applied &&
          gig.status === "Open" && (
            <ApplyForm gigId={gig.id} onApplied={setMyApplication} />
          )}
      </div>

      {gig.status === "Completed" && <ReviewSection gig={gig} />}
    </div>
  );
}
