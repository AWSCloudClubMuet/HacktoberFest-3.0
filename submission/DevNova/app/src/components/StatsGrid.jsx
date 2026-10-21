
import {
  BriefcaseBusiness,
  Users,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react";
import styles from "./StatsGrid.module.css";

function StatsGrid({ stats = {} }) {
  const cards = [
    {
      label: "Total Gigs",
      value: stats.totalGigs ?? 0,
      icon: BriefcaseBusiness,
      color: "purple",
    },
    {
      label: "Open Opportunities",
      value: stats.openGigs ?? 0,
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "My Applications",
      value: stats.applications ?? 0,
      icon: Users,
      color: "blue",
    },
    {
      label: "Completed Gigs",
      value: stats.completedGigs ?? 0,
      icon: ClipboardCheck,
      color: "orange",
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article className={styles.card} key={card.label}>
            <div className={`${styles.iconBox} ${styles[card.color]}`}>
              <Icon size={21} />
            </div>

            <div className={styles.cardInfo}>
              <span className={styles.label}>{card.label}</span>
              <strong className={styles.value}>{card.value}</strong>
            </div>

            <div className={styles.cardArrow}>
              <TrendingUp size={16} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default StatsGrid;
