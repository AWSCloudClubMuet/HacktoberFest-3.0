
import {
  ArrowUpRight,
  CalendarDays,
  Coins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./GigCard.module.css";

function GigCard({ gig, compact = false }) {
  const navigate = useNavigate();

  if (!gig) return null;

  const isRequest = gig.type === "Requesting";
  const isCompleted = gig.status === "Completed";
  const isInProgress = gig.status === "In Progress";

  const paymentLabel =
    gig.payment === "Skill Swap"
      ? "Skill Swap"
      : gig.payment === "Free"
        ? "Free"
        : "Paid";

  function formatDeadline(deadline) {
    if (!deadline) return "Flexible deadline";

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) return deadline;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getBudget() {
    if (gig.payment === "Free") return "Free";
    if (gig.payment === "Skill Swap") return "Skill exchange";

    if (
      gig.budget === undefined ||
      gig.budget === null ||
      gig.budget === ""
    ) {
      return "Budget negotiable";
    }

    return `Rs. ${Number(gig.budget).toLocaleString()}`;
  }

  function handleOpenGig() {
    navigate(`/explore?gig=${encodeURIComponent(gig.id)}`);
  }

  const isExpired =
    gig.deadline &&
    !Number.isNaN(new Date(gig.deadline).getTime()) &&
    new Date(gig.deadline).getTime() < new Date().setHours(0, 0, 0, 0);

  const canApply =
    gig.status === "Open" &&
    !isExpired;

  return (
    <article
      className={`${styles.card} ${compact ? styles.compact : ""}`}
    >
      <div className={styles.cardTop}>
        <span className={styles.category}>
          {gig.category || "General"}
        </span>

        <span
          className={`${styles.typeBadge} ${
            isRequest
              ? styles.requestBadge
              : styles.offerBadge
          }`}
        >
          {isRequest
            ? "Looking for help"
            : "Offering a skill"}
        </span>
      </div>

      <div className={styles.titleRow}>
        <h3>{gig.title || "Untitled opportunity"}</h3>

        <button
          type="button"
          className={styles.arrowButton}
          onClick={handleOpenGig}
          aria-label={`View ${gig.title || "gig"} details`}
        >
          <ArrowUpRight size={19} />
        </button>
      </div>

      <p className={styles.description}>
        {gig.description ||
          "No description has been provided yet."}
      </p>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <Coins size={15} />
          {paymentLabel}
        </span>

        <span className={styles.metaItem}>
          <CalendarDays size={15} />
          {formatDeadline(gig.deadline)}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.budget}>
          <span className={styles.budgetLabel}>
            Budget / Reward
          </span>
          <strong>{getBudget()}</strong>
        </div>

        <div className={styles.footerRight}>
          <span
            className={`${styles.status} ${
              isCompleted
                ? styles.completed
                : isInProgress
                  ? styles.inProgress
                  : styles.open
            }`}
          >
            {gig.status || "Open"}
          </span>

          <button
            type="button"
            className={styles.detailsButton}
            onClick={handleOpenGig}
          >
            View details <ArrowUpRight size={15} />
          </button>

          {canApply && (
            <button
              type="button"
              className={styles.detailsButton}
              onClick={handleOpenGig}
            >
              Apply Now <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default GigCard;
