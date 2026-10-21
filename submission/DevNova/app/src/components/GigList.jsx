
import { BriefcaseBusiness } from "lucide-react";
import GigCard from "./GigCard";
import styles from "./GigList.module.css";

function GigList({
  gigs = [],
  loading = false,
  compact = false,
  emptyTitle = "No opportunities found",
  emptyMessage = "Try changing your filters or check back later.",
}) {
  if (loading) {
    return (
      <div className={styles.loadingGrid}>
        {[1, 2, 3].map((item) => (
          <div className={styles.skeleton} key={item}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonTextShort} />
          </div>
        ))}
      </div>
    );
  }

  if (!gigs.length) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <BriefcaseBusiness size={27} />
        </div>

        <h3>{emptyTitle}</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.grid} ${compact ? styles.compactGrid : ""}`}>
      {gigs.map((gig) => (
        <GigCard key={gig.id} gig={gig} compact={compact} />
      ))}
    </div>
  );
}

export default GigList;
