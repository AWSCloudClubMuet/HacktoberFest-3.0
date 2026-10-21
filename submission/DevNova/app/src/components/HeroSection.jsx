
import { useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./HeroSection.module.css";

function HeroSection() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={styles.eyebrow}>
          <Sparkles size={15} />
          YOUR CAMPUS, YOUR OPPORTUNITIES
        </span>

        <h1>
          Skills Create
          <br />
          <span>Opportunities.</span>
          <br />
          Let’s Build Together!
        </h1>

        <p className={styles.description}>
          Turn your skills into opportunities. Discover campus gigs,
          collaborate with talented students, and grow together.
        </p>

        <form className={styles.searchForm} onSubmit={handleSearch}>
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="What skill are you looking for?"
            aria-label="Search for a skill"
          />

          <button type="submit" aria-label="Search opportunities">
            <ArrowRight size={19} />
          </button>
        </form>

        <button
          type="button"
          className={styles.exploreButton}
          onClick={() => navigate("/explore")}
        >
          Explore Opportunities <ArrowRight size={17} />
        </button>
      </div>

      <div className={styles.heroVisual}>
        <div className={styles.visualGlow} />

        <div className={styles.floatingBadge}>
          <span className={styles.badgeIcon}>
            <Sparkles size={17} />
          </span>

          <span>
            <strong>Learn & Earn</strong>
            <small>Grow your skills</small>
          </span>
        </div>

        <img
          src="/images/campus-team.png"
          alt="Students collaborating on campus projects"
          className={styles.heroImage}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling.style.display = "flex";
          }}
        />

        <div className={styles.visualFallback}>
          <div className={styles.fallbackCircle}>
            <span>💡</span>
          </div>

          <div className={styles.fallbackPeople}>
            <div className={`${styles.person} ${styles.personOne}`}>S</div>
            <div className={`${styles.person} ${styles.personTwo}`}>D</div>
            <div className={`${styles.person} ${styles.personThree}`}>C</div>
          </div>

          <strong>Ideas become opportunities.</strong>
          <p>Connect. Collaborate. Create.</p>
        </div>

        <div className={styles.floatingNote}>
          <span className={styles.noteCheck}>✓</span>

          <span>
            <strong>Made for students</strong>
            <small>Built on collaboration</small>
          </span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
