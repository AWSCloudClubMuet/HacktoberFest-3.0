
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { getGigs, updateGig } from "../services/gigService";
import styles from "./MyGigs.module.css";

const CURRENT_USER_ID = "1";

function MyGigs() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadGigs() {
    setLoading(true);
    setError("");

    try {
      const data = await getGigs();
      const myGigs = (Array.isArray(data) ? data : []).filter(
        (gig) => String(gig.ownerId) === CURRENT_USER_ID
      );
      setGigs(myGigs);
    } catch {
      setError("Could not load your gigs. Check JSON Server on port 3001.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGigs();
  }, []);

  async function handleStatusChange(gig, status) {
    try {
      setUpdatingId(gig.id);
      setError("");

      const updatedGig = await updateGig(gig.id, { status });

      setGigs((currentGigs) =>
        currentGigs.map((item) =>
          String(item.id) === String(gig.id)
            ? { ...item, ...updatedGig, status }
            : item
        )
      );
    } catch {
      setError("Could not update the gig status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  function statusClass(status) {
    if (status === "Completed") return styles.completed;
    if (status === "In Progress") return styles.inProgress;
    return styles.open;
  }

  const openCount = gigs.filter((gig) => gig.status === "Open").length;
  const activeCount = gigs.filter(
    (gig) => gig.status === "In Progress"
  ).length;
  const completedCount = gigs.filter(
    (gig) => gig.status === "Completed"
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>YOUR WORKSPACE</span>
          <h1>My Gigs</h1>
          <p>Manage your opportunities and track project progress.</p>
        </div>

        <div className={styles.headerIcon}>
          <BriefcaseBusiness size={25} />
        </div>
      </header>

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span className={styles.statIcon}><BriefcaseBusiness size={20} /></span>
          <div><span>Total gigs</span><strong>{gigs.length}</strong></div>
        </article>

        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.greenIcon}`}><Clock3 size={20} /></span>
          <div><span>Open</span><strong>{openCount}</strong></div>
        </article>

        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.blueIcon}`}><RefreshCw size={20} /></span>
          <div><span>In progress</span><strong>{activeCount}</strong></div>
        </article>

        <article className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.orangeIcon}`}><CheckCircle2 size={20} /></span>
          <div><span>Completed</span><strong>{completedCount}</strong></div>
        </article>
      </section>

      <section className={styles.listSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Your posted opportunities</h2>
            <p>Update a gig when its progress changes.</p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={loadGigs}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.stateBox}>Loading your gigs...</div>
        ) : gigs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <BriefcaseBusiness size={29} />
            </div>
            <h3>You haven't posted any gigs yet</h3>
            <p>
              Gigs you create will appear here, where you can manage their
              progress.
            </p>
          </div>
        ) : (
          <div className={styles.gigList}>
            {gigs.map((gig) => (
              <article className={styles.gigCard} key={gig.id}>
                <div className={styles.gigIcon}>
                  <BriefcaseBusiness size={21} />
                </div>

                <div className={styles.gigInfo}>
                  <div className={styles.gigTop}>
                    <span className={styles.category}>
                      {gig.category || "General"}
                    </span>
                    <span
                      className={`${styles.status} ${statusClass(
                        gig.status || "Open"
                      )}`}
                    >
                      {gig.status || "Open"}
                    </span>
                  </div>

                  <h3>{gig.title}</h3>
                  <p>{gig.description}</p>

                  <div className={styles.meta}>
                    <span>{gig.payment || "Not specified"}</span>
                    {gig.deadline && (
                      <span>
                        <CalendarDays size={14} />
                        {gig.deadline}
                      </span>
                    )}
                  </div>

                  <label className={styles.statusLabel}>
                    Update status
                    <select
                      value={gig.status || "Open"}
                      disabled={updatingId === gig.id}
                      onChange={(event) =>
                        handleStatusChange(gig, event.target.value)
                      }
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyGigs;
