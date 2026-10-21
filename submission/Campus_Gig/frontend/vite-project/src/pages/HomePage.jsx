import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import GigCard from "../components/GigCard";
import GigFilters from "../components/GigFilters";
import { FILTER_KEYS } from "../constants";
import { useUser } from "../UserContext";
import "../styles/HomePage.css";

export default function HomePage() {
  const { currentUser } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const [result, setResult] = useState({
    key: null,
    gigs: [],
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    const current = new URLSearchParams(queryString);
    const params = {};

    FILTER_KEYS.forEach((key) => {
      const value = current.get(key);
      if (value) params[key] = value;
    });

    api
      .listGigs(params)
      .then((gigs) => {
        if (!cancelled) {
          setResult({ key: queryString, gigs, error: "" });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: queryString,
            gigs: [],
            error: err.message,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const loading = result.key !== queryString;

  const values = {};
  FILTER_KEYS.forEach((key) => {
    values[key] = searchParams.get(key) || "";
  });

  const handleApply = (next) => {
    const params = new URLSearchParams();

    FILTER_KEYS.forEach((key) => {
      if (next[key]) params.set(key, next[key]);
    });

    setSearchParams(params);
  };

  const hasFilters = FILTER_KEYS.some((key) => values[key] !== "");

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            <span className="home-eyebrow-dot" />
            CAMPUS GIG & SKILLSWAP
          </span>

          <h1>
            Good skills.
            <br />
            <span>Great connections.</span>
          </h1>

          <p>
            Find talented students, share what you know, and turn ideas into
            meaningful collaborations. Paid work, skill swaps, or helping each
            other out — find your kind of gig.
          </p>
        </div>

        <div className="home-hero-note">
          <div className="home-hero-icon" aria-hidden="true">
            ✳
          </div>

          <p className="home-hero-note-title">Something to offer?</p>

          <p className="home-hero-note-text">
            Your next project could start with one conversation.
          </p>

          <Link
            to={currentUser ? "/gigs/new" : "/welcome"}
            className="home-hero-link"
          >
            {currentUser ? "Share your skills" : "Join the community"}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="home-marketplace">
        <div className="page-header home-page-header">
          <div className="home-section-heading">
            <span className="home-section-kicker">EXPLORE THE MARKETPLACE</span>
            <h2>Browse gigs</h2>
            <p>Find your next opportunity or someone who can help.</p>
          </div>

          <Link
            className="home-post-button"
            to={currentUser ? "/gigs/new" : "/welcome"}
          >
            <span aria-hidden="true">+</span>
            Post a Gig
          </Link>
        </div>

        <GigFilters key={queryString} values={values} onApply={handleApply} />

        {result.error && (
          <div className="alert home-error" role="alert">
            {result.error}
          </div>
        )}

        {loading && (
          <div className="home-loading" role="status">
            <span className="home-spinner" />
            Loading gigs...
          </div>
        )}

        {!loading && !result.error && (
          <>
            <div className="home-results-bar">
              <p className="home-results-count">
                <strong>{result.gigs.length}</strong>{" "}
                {result.gigs.length === 1 ? "gig" : "gigs"} found
              </p>

              {hasFilters && (
                <span className="home-filter-indicator">Filters applied</span>
              )}
            </div>

            {result.gigs.length === 0 ? (
              <div className="home-empty-state">
                <div className="home-empty-icon" aria-hidden="true">
                  ◇
                </div>

                <h3>
                  {hasFilters
                    ? "No gigs match your search"
                    : "The first opportunity is yours"}
                </h3>

                <p>
                  {hasFilters
                    ? "Try changing your search or clearing some filters."
                    : "There are no gigs to show right now. Check back soon or post the first one."}
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    className="home-reset-button"
                    onClick={() => setSearchParams(new URLSearchParams())}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="gig-list home-gig-grid">
                {result.gigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
