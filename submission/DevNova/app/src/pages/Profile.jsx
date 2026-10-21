
import { useEffect, useState } from "react";
import {
  UserRound,
  Star,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { getUserById } from "../services/gigService";
import { getGigs } from "../services/gigService";
import {
  getReviewsByReviewee,
  getAverageRating,
} from "../services/reviewService";
import styles from "./Profile.module.css";

const CURRENT_USER_ID = "1";

function Profile() {
  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ average: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const [userResult, gigsResult, reviewsResult, ratingResult] =
        await Promise.allSettled([
          getUserById(CURRENT_USER_ID),
          getGigs(),
          getReviewsByReviewee(CURRENT_USER_ID),
          getAverageRating(CURRENT_USER_ID),
        ]);

      if (userResult.status === "fulfilled") {
        setUser(userResult.value);
      } else {
        setUser(null);
      }

      if (gigsResult.status === "fulfilled") {
        setGigs(
          (Array.isArray(gigsResult.value) ? gigsResult.value : []).filter(
            (gig) => String(gig.ownerId) === CURRENT_USER_ID
          )
        );
      } else {
        setGigs([]);
      }

      setReviews(
        reviewsResult.status === "fulfilled" &&
          Array.isArray(reviewsResult.value)
          ? reviewsResult.value
          : []
      );

      setRating(
        ratingResult.status === "fulfilled"
          ? ratingResult.value
          : { average: 0, totalReviews: 0 }
      );

      if (
        userResult.status === "rejected" &&
        gigsResult.status === "rejected"
      ) {
        setError(
          "Could not connect to the server. Make sure JSON Server is running on port 3001."
        );
      }
    } catch {
      setError("Unable to load profile information. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const completedGigs = gigs.filter(
    (gig) => gig.status === "Completed"
  ).length;

  const name = user?.name || user?.fullName || "Campus Student";
  const skills = Array.isArray(user?.skills)
    ? user.skills
    : typeof user?.skills === "string"
      ? user.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>YOUR PERSONAL SPACE</span>
          <h1>My Profile</h1>
          <p>Showcase your skills, experience, and campus activity.</p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={loadProfile}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.stateBox}>Loading your profile...</div>
      ) : (
        <>
          <section className={styles.profileCard}>
            <div className={styles.cover}>
              <div className={styles.coverPattern} />
            </div>

            <div className={styles.profileBody}>
              <div className={styles.avatar}>{initial}</div>

              <div className={styles.identity}>
                <div className={styles.nameRow}>
                  <h2>{name}</h2>
                  <span className={styles.memberBadge}>Student Member</span>
                </div>

                <p className={styles.role}>
                  {user?.title || user?.role || "Campus Skill Contributor"}
                </p>

                <div className={styles.userMeta}>
                  <span><GraduationCap size={15} /> Campus Community</span>
                  {user?.location && (
                    <span><MapPin size={14} /> {user.location}</span>
                  )}
                </div>

                {user?.email && (
                  <p className={styles.email}>{user.email}</p>
                )}
              </div>
            </div>
          </section>

          <section className={styles.statsGrid}>
            <article className={styles.statCard}>
              <span className={styles.statIcon}><BriefcaseBusiness size={20} /></span>
              <div><span>Posted gigs</span><strong>{gigs.length}</strong></div>
            </article>

            <article className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.greenIcon}`}><CheckCircle2 size={20} /></span>
              <div><span>Completed</span><strong>{completedGigs}</strong></div>
            </article>

            <article className={styles.statCard}>
              <span className={`${styles.statIcon} ${styles.yellowIcon}`}><Star size={20} /></span>
              <div>
                <span>Average rating</span>
                <strong>{Number(rating?.average || 0).toFixed(1)} / 5</strong>
              </div>
            </article>
          </section>

          <section className={styles.contentCard}>
            <div className={styles.sectionHeading}>
              <div className={styles.headingIcon}><UserRound size={19} /></div>
              <div>
                <h2>About me</h2>
                <p>A little introduction about this student.</p>
              </div>
            </div>

            <p className={styles.aboutText}>
              {user?.bio ||
                "Welcome to my DevNova profile! I am part of the campus community and interested in learning, sharing skills, and collaborating with other students on projects."}
            </p>
          </section>

          <section className={styles.contentCard}>
            <div className={styles.sectionHeading}>
              <div className={`${styles.headingIcon} ${styles.skillsIcon}`}>
                <GraduationCap size={20} />
              </div>
              <div>
                <h2>Skills & expertise</h2>
                <p>Skills this student has added to their profile.</p>
              </div>
            </div>

            {skills.length > 0 ? (
              <div className={styles.skillsList}>
                {skills.map((skill, index) => (
                  <span className={styles.skillTag} key={`${skill}-${index}`}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.mutedText}>
                No skills added yet. Skills will appear here when available
                in the user profile data.
              </p>
            )}
          </section>

          <section className={styles.contentCard}>
            <div className={styles.sectionHeading}>
              <div className={`${styles.headingIcon} ${styles.reviewIcon}`}>
                <Star size={19} />
              </div>
              <div>
                <h2>Reviews & ratings</h2>
                <p>
                  {rating?.totalReviews || reviews.length} student review(s)
                </p>
              </div>
              <div className={styles.ratingSummary}>
                <Star size={17} fill="currentColor" />
                {Number(rating?.average || 0).toFixed(1)}
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className={styles.reviewList}>
                {reviews.map((review) => (
                  <article className={styles.reviewItem} key={review.id}>
                    <div className={styles.reviewerAvatar}>
                      <UserRound size={18} />
                    </div>

                    <div className={styles.reviewContent}>
                      <div className={styles.reviewTop}>
                        <strong>Campus Student</strong>
                        <span className={styles.reviewStars}>
                          {"★".repeat(
                            Math.max(
                              0,
                              Math.min(5, Number(review.rating) || 0)
                            )
                          )}
                        </span>
                      </div>
                      <p>{review.comment || "No written comment provided."}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyReviews}>
                <Star size={24} />
                <p>No reviews yet.</p>
                <span>Reviews will appear here after completed collaborations.</span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Profile;
