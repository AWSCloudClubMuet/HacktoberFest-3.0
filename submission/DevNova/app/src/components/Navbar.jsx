
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown } from "lucide-react";
import styles from "./Navbar.module.css";

function Navbar() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className={styles.navbar}>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <Search size={19} className={styles.searchIcon} />

        <input
          type="search"
          placeholder="Search gigs, skills, or opportunities..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search gigs"
        />

        <button type="submit" className={styles.searchButton}>
          Search
        </button>
      </form>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.notificationButton}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
          <span className={styles.notificationDot} />
        </button>

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.userButton}
          onClick={() => navigate("/profile")}
          aria-label="Open profile"
        >
          <span className={styles.avatar}>S</span>

          <span className={styles.userInfo}>
            <strong>Student User</strong>
            <small>Campus Member</small>
          </span>

          <ChevronDown size={16} className={styles.chevron} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
