
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import HeroSection from "../components/HeroSection";
import StatsGrid from "../components/StatsGrid";
import CategoryFilter from "../components/CategoryFilter";
import GigList from "../components/GigList";

import { getGigs } from "../services/gigService";
import { getApplicationsByApplicant } from "../services/applicationService";

import styles from "./Dashboard.module.css";

// Demo current user. Replace with the authenticated user's ID later.
const CURRENT_USER_ID = "1";

function Dashboard() {
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [gigsData, applicationsData] = await Promise.all([
          getGigs(),
          getApplicationsByApplicant(CURRENT_USER_ID),
        ]);

        if (!isMounted) return;

        setGigs(Array.isArray(gigsData) ? gigsData : []);
        setApplications(
          Array.isArray(applicationsData) ? applicationsData : []
        );
      } catch (err) {
        if (!isMounted) return;

        setError(
          "Could not load dashboard data. Make sure JSON Server is running on port 3001."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const openGigs = useMemo(
    () => gigs.filter((gig) => (gig.status || "Open") === "Open"),
    [gigs]
  );

  const filteredGigs = useMemo(() => {
    let result = openGigs;

    if (selectedCategory !== "All") {
      result = result.filter(
        (gig) => gig.category === selectedCategory
      );
    }

    // Show opportunities posted by other users.
    result = result.filter(
      (gig) => String(gig.ownerId) !== CURRENT_USER_ID
    );

    return result;
  }, [openGigs, selectedCategory]);

  const stats = useMemo(
    () => ({
      totalGigs: gigs.length,
      openGigs: openGigs.length,
      applications: applications.length,
      completedGigs: gigs.filter(
        (gig) => gig.status === "Completed"
      ).length,
    }),
    [gigs, openGigs, applications]
  );

  return (
    <div className={styles.dashboard}>
      <HeroSection />

      <section className={styles.statsSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>YOUR OVERVIEW</span>
            <h2>Your Campus at a Glance</h2>
            <p>Track opportunities and your activity in one place.</p>
          </div>
        </div>

        <StatsGrid stats={stats} />
      </section>

      <section className={styles.opportunitiesSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>
              <Sparkles size={14} />
              HANDPICKED FOR YOU
            </span>

            <h2>Explore Opportunities</h2>
            <p>
              Find projects, share your expertise, and collaborate with
              talented students.
            </p>
          </div>

          <button
            type="button"
            className={styles.viewAllButton}
            onClick={() => navigate("/explore")}
          >
            View all <ArrowRight size={16} />
          </button>
        </div>

        <div className={styles.filterWrapper}>
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {error ? (
          <div className={styles.errorState}>
            <h3>Unable to load opportunities</h3>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : (
          <GigList
            gigs={filteredGigs.slice(0, 4)}
            loading={loading}
            compact
            emptyTitle="No opportunities in this category"
            emptyMessage="Choose another category or explore all available gigs."
          />
        )}
      </section>

      <footer className={styles.dashboardFooter}>
        <span>Made for students, powered by collaboration.</span>
        <span>DevNova Campus</span>
      </footer>
    </div>
  );
}

export default Dashboard;
