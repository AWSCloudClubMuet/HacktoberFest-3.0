import { Link } from "react-router-dom";
import { formatDate, paymentLabel } from "../utils";
import StatusBadge from "./StatusBadge";

export default function GigCard({ gig }) {
  const showBudget = gig.payment_type === "Paid" && gig.budget !== null;

  return (
    <div className="card gig-card">
      <div className="badges">
        <span className="badge badge-type">{gig.type}</span>
        <span className="badge">{gig.category}</span>
        <span className="badge">
          {paymentLabel(gig.payment_type)}
          {showBudget ? ` · ${Number(gig.budget).toLocaleString()}` : ""}
        </span>
        <StatusBadge status={gig.status} />
      </div>
      <h3>
        <Link to={`/gigs/${gig.id}`}>{gig.title}</Link>
      </h3>
      <p className="muted clamp">{gig.description}</p>
      <p className="muted small">
        Posted by <Link to={`/profile/${gig.owner.id}`}>{gig.owner.name}</Link>{" "}
        · Deadline: {formatDate(gig.deadline)}
      </p>
    </div>
  );
}
