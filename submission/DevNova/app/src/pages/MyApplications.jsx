
import { useEffect, useState } from "react";
import {
  ClipboardList,
  CalendarDays,
  BriefcaseBusiness,
  RefreshCw,
} from "lucide-react";
import { getApplicationsByApplicant } from "../services/applicationService";
import { getGigs } from "../services/gigService";
import styles from "./MyApplications.module.css";

const CURRENT_USER_ID = "1";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const [applicationData, gigData] = await Promise.all([
        getApplicationsByApplicant(CURRENT_USER_ID),
        getGigs(),
      ]);

      setApplications(Array.isArray(applicationData) ? applicationData : []);
      setGigs(Array.isArray(gigData) ? gigData : []);
    } catch {
      setError(
        "Unable to load applications. Make sure JSON Server is running on port 3001."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const getStatusClass = (status) => {
    const normalized = (status || "Pending").toLowerCase();
    if (normalized === "accepted") return styles.accepted;
    if (normalized === "rejected") return styles.rejected;
    return styles.pending;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>YOUR ACTIVITY</span>
          <h1>My Applications</h1>
          <p>Track the opportunities you have applied for.</p>
        </div>

        <div className={styles.headerIcon}>
          <ClipboardList size={25} />
        </div>
      </header>

      <section className={styles.summary}>
        <div className={styles.summaryIcon}>
          <BriefcaseBusiness size={21} />
        </div>
        <div>
          <span>Total applications</span>
          <strong>{applications.length}</strong>
        </div>
        <div className={styles.summaryDivider} />
        <div>
          <span>Pending review</span>
          <strong>
            {applications.filter((app) => app.status === "Pending").length}
          </strong>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Application history</h2>
            <p>Review the status of each application.</p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={loadApplications}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className={styles.stateBox}>Loading your applications...</div>
        ) : error ? (
          <div className={styles.stateBox}>
            <p>{error}</p>
            <button type="button" onClick={loadApplications}>
              Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ClipboardList size={28} />
            </div>
            <h3>No applications yet</h3>
            <p>
              When you apply for a campus gig, it will appear here so you can
              track its progress.
            </p>
          </div>
        ) : (
          <div className={styles.applicationList}>
            {applications.map((application) => {
              const gig = gigs.find(
                (item) => String(item.id) === String(application.gigId)
              );

              return (
                <article
                  className={styles.applicationCard}
                  key={application.id}
                >
                  <div className={styles.gigIcon}>
                    <BriefcaseBusiness size={21} />
                  </div>

                  <div className={styles.applicationInfo}>
                    <div className={styles.cardTop}>
                      <span className={styles.category}>
                        {gig?.category || "Campus opportunity"}
                      </span>
                      <span
                        className={`${styles.status} ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {application.status || "Pending"}
                      </span>
                    </div>

                    <h3>{gig?.title || "Gig details unavailable"}</h3>
                    <p>
                      {gig?.description ||
                        "The original gig may no longer be available."}
                    </p>

                    <div className={styles.meta}>
                      <span>
                        <CalendarDays size={14} />
                        {application.createdAt
                          ? new Date(application.createdAt).toLocaleDateString()
                          : "Date not provided"}
                      </span>
                      <span>{gig?.payment || "Payment not specified"}</span>
                    </div>

                    {application.message && (
                      <div className={styles.message}>
                        <strong>Your message:</strong> {application.message}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyApplications;
