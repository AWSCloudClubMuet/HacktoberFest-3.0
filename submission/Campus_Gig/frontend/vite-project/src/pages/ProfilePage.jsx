import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import GigCard from "../components/GigCard";
import { useUser } from "../UserContext";
import "../styles/ProfilePage.css";

// Reset profile state whenever the route ID changes.
export default function ProfilePage() {
  const { id } = useParams();
  return <ProfileView key={id} id={id} />;
}

function ProfileView({ id }) {
  const { currentUser } = useUser();

  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.getUser(id),
      api.listGigs({ user_id: id }),
      api.userReviews(id),
    ])
      .then(([profileData, gigsData, reviewData]) => {
        if (cancelled) return;

        setProfile(profileData);
        setGigs(gigsData);
        setReviews(reviewData);
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

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-state">
          <span className="profile-spinner" />
          <p>Loading student profile...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page">
        <div className="profile-error" role="alert">
          <span aria-hidden="true">!</span>
          <div>
            <strong>We couldn't load this profile</strong>
            <p>{error}</p>
            <Link to="/" className="profile-error-link">
              Return to Browse Gigs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <div className="profile-error">
          <div>
            <strong>Profile not found</strong>
            <p>This student profile is no longer available.</p>
            <Link to="/" className="profile-error-link">
              Browse Gigs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const isOwnProfile =
    currentUser && String(currentUser.id) === String(profile.id);
  const averageRating =
    profile.average_rating != null ? Number(profile.average_rating) : null;
  const reviewCount = profile.review_count ?? reviews.length;
  const initials = (profile.name || "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-topline">
          <span className="profile-eyebrow">
            <span className="profile-eyebrow-dot" />
            STUDENT PROFILE
          </span>

          {isOwnProfile && (
            <Link to="/profile/edit" className="profile-edit-button">
              <span aria-hidden="true">↗</span>
              Edit profile
            </Link>
          )}
        </div>

        <div className="profile-identity">
          <div className="profile-avatar" aria-label={`Initials: ${initials}`}>
            {initials}
          </div>

          <div className="profile-identity-copy">
            <h1>{profile.name}</h1>

            <p className="profile-major">
              {profile.major || "Major not specified"}
              <span aria-hidden="true">·</span>
              Semester {profile.semester ?? "—"}
            </p>

            <div className="profile-identity-tags">
              <span className="profile-identity-tag">
                <span aria-hidden="true">✦</span>
                Campus community
              </span>

              {averageRating !== null && (
                <span className="profile-rating-chip">
                  <span aria-hidden="true">★</span>
                  {averageRating.toFixed(1)}
                  <span className="profile-rating-count">({reviewCount})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {profile.bio && (
          <div className="profile-bio">
            <span className="profile-bio-label">ABOUT</span>
            <p>{profile.bio}</p>
          </div>
        )}
      </section>

      <section className="profile-skills-panel">
        <div className="profile-section-heading">
          <div>
            <span className="profile-section-kicker">AREAS OF EXPERTISE</span>
            <h2>Skills & interests</h2>
          </div>

          <span className="profile-section-count">
            {skills.length} {skills.length === 1 ? "skill" : "skills"}
          </span>
        </div>

        {skills.length > 0 ? (
          <div className="profile-skills-list">
            {skills.map((skill) => (
              <span className="profile-skill-chip" key={skill}>
                <span aria-hidden="true">✦</span>
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="profile-muted">
            No skills have been added to this profile yet.
          </p>
        )}
      </section>

      <section className="profile-stats-grid">
        <article className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-purple">↗</div>
          <div>
            <span>Gigs posted</span>
            <strong>{profile.gigs_posted ?? 0}</strong>
            <p>Opportunities shared</p>
          </div>
        </article>

        <article className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-blue">✓</div>
          <div>
            <span>Gigs completed</span>
            <strong>{profile.gigs_completed ?? 0}</strong>
            <p>Successful collaborations</p>
          </div>
        </article>

        <article className="profile-stat-card">
          <div className="profile-stat-icon profile-stat-gold">★</div>
          <div>
            <span>Average rating</span>
            <strong>
              {averageRating !== null ? averageRating.toFixed(1) : "—"}
              {averageRating !== null && (
                <span className="profile-stat-out-of"> / 5</span>
              )}
            </strong>
            <p>
              {reviewCount > 0
                ? `${reviewCount} reviews received`
                : "No reviews yet"}
            </p>
          </div>
        </article>
      </section>

      <section className="profile-content-section">
        <div className="profile-section-heading">
          <div>
            <span className="profile-section-kicker">COMMUNITY FEEDBACK</span>
            <h2>Reviews received</h2>
            <p>Feedback shared by students after their collaborations.</p>
          </div>

          <span className="profile-section-count">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="profile-empty">
            <div className="profile-empty-icon" aria-hidden="true">
              ★
            </div>
            <h3>Reputation starts with collaboration</h3>
            <p>
              This student hasn't received any reviews yet. Completed gigs help
              build a reputation over time.
            </p>
          </div>
        ) : (
          <div className="profile-reviews-grid">
            {reviews.map((review) => (
              <article className="profile-review-card" key={review.id}>
                <div className="profile-review-top">
                  <div className="profile-review-avatar" aria-hidden="true">
                    {(review.reviewer?.name || "S")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="profile-review-author">
                    <strong>{review.reviewer?.name || "Student"}</strong>
                    <span>Verified gig participant</span>
                  </div>

                  <div
                    className="profile-review-rating"
                    aria-label={`Rating: ${review.rating} out of 5`}
                  >
                    <span aria-hidden="true">★</span>
                    {review.rating}/5
                  </div>
                </div>

                <div className="profile-review-gig">
                  <span>REVIEW FOR</span>
                  <strong>{review.gig_title || "Completed gig"}</strong>
                </div>

                <p className="profile-review-comment">{review.comment}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="profile-content-section profile-gigs-section">
        <div className="profile-section-heading">
          <div>
            <span className="profile-section-kicker">MARKETPLACE ACTIVITY</span>
            <h2>Gigs posted by {profile.name}</h2>
            <p>Explore the opportunities this student has shared.</p>
          </div>

          <span className="profile-section-count">
            {gigs.length} {gigs.length === 1 ? "gig" : "gigs"}
          </span>
        </div>

        {gigs.length === 0 ? (
          <div className="profile-empty">
            <div className="profile-empty-icon" aria-hidden="true">
              ↗
            </div>
            <h3>No gigs posted yet</h3>
            <p>There are no gigs to display here at the moment.</p>
          </div>
        ) : (
          <div className="gig-list profile-gig-list">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
