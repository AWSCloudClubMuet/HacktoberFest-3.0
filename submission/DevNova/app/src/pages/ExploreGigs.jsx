
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Send,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import CategoryFilter from "../components/CategoryFilter";
import GigList from "../components/GigList";
import { getGigs } from "../services/gigService";
import {
  createApplication,
  getApplicationsByApplicant,
} from "../services/applicationService";

import styles from "./ExploreGigs.module.css";

const CURRENT_USER_ID = "1";

function ExploreGigs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [payment, setPayment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationNotice, setApplicationNotice] = useState("");
  const [applicationError, setApplicationError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGigs() {
      try {
        const data = await getGigs();

        if (active) {
          setGigs(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch {
        if (active) {
          setError(
            "Could not load gigs. Check that JSON Server is running on port 3001."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadGigs();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const selectedGigId = searchParams.get("gig");

  const selectedGig = useMemo(
    () =>
      gigs.find(
        (gig) => String(gig.id) === String(selectedGigId)
      ),
    [gigs, selectedGigId]
  );

  const isOwnGig =
    selectedGig &&
    String(selectedGig.ownerId) === CURRENT_USER_ID;

  const isExpired =
    selectedGig?.deadline &&
    !Number.isNaN(new Date(selectedGig.deadline).getTime()) &&
    new Date(selectedGig.deadline).getTime() <
      new Date().setHours(0, 0, 0, 0);

  const canApply =
    Boolean(selectedGig) &&
    !isOwnGig &&
    (selectedGig?.status || "Open") === "Open" &&
    !isExpired;

  const filteredGigs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return gigs.filter((gig) => {
      const matchesSearch =
        !query ||
        `${gig.title || ""} ${gig.description || ""} ${gig.category || ""}`
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All" || gig.category === category;

      const matchesType =
        type === "All" || gig.type === type;

      const gigPayment = gig.paymentType || gig.payment || "Not specified";

      const matchesPayment =
        payment === "All" || gigPayment === payment;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesPayment
      );
    });
  }, [gigs, search, category, type, payment]);

  function handleSearch(event) {
    event.preventDefault();

    const nextParams = new URLSearchParams(searchParams);

    if (search.trim()) {
      nextParams.set("q", search.trim());
    } else {
      nextParams.delete("q");
    }

    nextParams.delete("gig");
    setSearchParams(nextParams);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setType("All");
    setPayment("All");
    setSearchParams({});
    setApplicationNotice("");
    setApplicationError("");
    setMessage("");
  }

  function closeGigDetails() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("gig");
    setSearchParams(nextParams);

    setMessage("");
    setApplicationNotice("");
    setApplicationError("");
  }

  async function handleApply(event) {
    event.preventDefault();

    setApplicationNotice("");
    setApplicationError("");

    if (!selectedGig) {
      setApplicationError("Gig not found. Please select another gig.");
      return;
    }

    if (isOwnGig) {
      setApplicationError("You cannot apply to your own gig.");
      return;
    }

    if (!canApply) {
      setApplicationError(
        "This gig is no longer accepting applications."
      );
      return;
    }

    if (!message.trim()) {
      setApplicationError("Please write an application message.");
      return;
    }

    setSubmitting(true);

    try {
      const existingApplications =
        await getApplicationsByApplicant(CURRENT_USER_ID);

      const alreadyApplied = existingApplications.some(
        (application) =>
          String(application.gigId) === String(selectedGig.id)
      );

      if (alreadyApplied) {
        setApplicationError(
          "You have already applied to this gig. Check My Applications."
        );
        return;
      }

      await createApplication({
        gigId: String(selectedGig.id),
        applicantId: CURRENT_USER_ID,
        message: message.trim(),
        status: "Pending",
        createdAt: new Date().toISOString(),
      });

      setMessage("");
      setApplicationNotice(
        "Application submitted successfully! Visit My Applications to track it."
      );
    } catch {
      setApplicationError(
        "Could not submit your application. Check that JSON Server is running on port 3001."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>CAMPUS MARKETPLACE</span>
          <h1>Explore Opportunities</h1>
          <p>
            Discover student projects, exchange skills, and find your next
            collaboration.
          </p>
        </div>

        <div className={styles.resultBadge}>
          <strong>{filteredGigs.length}</strong>
          <span>opportunities</span>
        </div>
      </header>

      <form className={styles.searchBar} onSubmit={handleSearch}>
        <Search size={20} />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by skill, title, or keyword..."
          aria-label="Search gigs"
        />

        <button type="submit">Search</button>
      </form>

      <section className={styles.filtersPanel}>
        <div className={styles.filtersHeading}>
          <h2>
            <SlidersHorizontal size={17} />
            Filter opportunities
          </h2>

          <button type="button" onClick={clearFilters}>
            Clear all
          </button>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Category</span>

          <div className={styles.categoryScroll}>
            <CategoryFilter
              selected={category}
              onChange={setCategory}
            />
          </div>
        </div>

        <div className={styles.selectFilters}>
          <label>
            Opportunity type
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="All">All types</option>
              <option value="Offering">Offering a skill</option>
              <option value="Requesting">Looking for help</option>
            </select>
          </label>

          <label>
            Payment
            <select
              value={payment}
              onChange={(event) => setPayment(event.target.value)}
            >
              <option value="All">All payment types</option>
              <option value="Paid">Paid</option>
              <option value="Skill Swap">Skill Swap</option>
              <option value="Free">Free</option>
            </select>
          </label>
        </div>
      </section>

      {selectedGigId && (
        <section className={styles.applicationPanel}>
          <div className={styles.applicationPanelHeader}>
            <div>
              <span className={styles.eyebrow}>GIG DETAILS</span>
              <h2>{selectedGig?.title || "Gig details"}</h2>
            </div>

            <button
              type="button"
              className={styles.closeApplication}
              onClick={closeGigDetails}
              aria-label="Close gig details"
            >
              <X size={20} />
            </button>
          </div>

          {!selectedGig ? (
            <p>
              {loading
                ? "Loading gig details..."
                : "Gig not found. Close this panel and select another opportunity."}
            </p>
          ) : (
            <>
              <p className={styles.applicationDescription}>
                {selectedGig.description || "No description provided."}
              </p>

              <div className={styles.applicationMeta}>
                <span>
                  Category: {selectedGig.category || "General"}
                </span>
                <span>
                  Payment: {selectedGig.paymentType || selectedGig.payment || "Not specified"}
                </span>
                <span>
                  Status: {selectedGig.status || "Open"}
                </span>
              </div>

              {applicationNotice && (
                <div className={styles.applicationSuccess} role="status">
                  {applicationNotice}
                </div>
              )}

              {applicationError && (
                <div className={styles.applicationError} role="alert">
                  {applicationError}
                </div>
              )}

              {isOwnGig ? (
                <p>You cannot apply to your own gig.</p>
              ) : !canApply ? (
                <p>This gig is not accepting applications.</p>
              ) : !applicationNotice ? (
                <form
                  className={styles.applicationForm}
                  onSubmit={handleApply}
                >
                  <label htmlFor="application-message">
                    Why are you a good fit?
                  </label>

                  <textarea
                    id="application-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Introduce yourself and explain how you can help..."
                    rows={4}
                    maxLength={1000}
                    required
                  />

                  <div className={styles.applicationFormFooter}>
                    <span>{message.length}/1000 characters</span>

                    <button type="submit" disabled={submitting}>
                      <Send size={16} />
                      {submitting
                        ? "Submitting..."
                        : "Submit application"}
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          )}
        </section>
      )}

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeading}>
          <div>
            <h2>Available gigs</h2>
            <p>Find an opportunity that matches your skills.</p>
          </div>
          <span>{filteredGigs.length} found</span>
        </div>

        {error ? (
          <div className={styles.errorState}>
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
            gigs={filteredGigs}
            loading={loading}
            emptyTitle="No matching opportunities"
            emptyMessage="Try another keyword or change your filters."
          />
        )}
      </section>
    </div>
  );
}

export default ExploreGigs;
