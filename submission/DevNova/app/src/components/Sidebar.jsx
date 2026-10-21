
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  BriefcaseBusiness,
  MessageCircle,
  UserRound,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Explore Gigs", path: "/explore", icon: Search },
  { label: "My Applications", path: "/applications", icon: ClipboardList },
  { label: "My Gigs", path: "/my-gigs", icon: BriefcaseBusiness },
  { label: "Messages", path: "/messages", icon: MessageCircle },
  { label: "My Profile", path: "/profile", icon: UserRound },
];

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <NavLink to="/" className={styles.brand}>
        <span className={styles.logo}>
          <Sparkles size={25} />
        </span>

        <span className={styles.brandText}>
          <strong>DevNova</strong>
          <small>Campus Marketplace</small>
        </span>
      </NavLink>

      <div className={styles.menuHeading}>WORKSPACE</div>

      <nav className={styles.navigation} aria-label="Main navigation">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            <Icon size={20} strokeWidth={1.9} />
            <span>{label}</span>
            {label === "Explore Gigs" && (
              <ArrowUpRight className={styles.linkArrow} size={15} />
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.sidebarBottom}>
        <div className={styles.promoCard}>
          <span className={styles.promoIcon}>
            <Sparkles size={19} />
          </span>

          <h3>Your skills have value!</h3>
          <p>Share what you know and discover new opportunities.</p>

          <NavLink to="/my-gigs" className={styles.promoLink}>
            Start exploring <ArrowUpRight size={15} />
          </NavLink>
        </div>

        <div className={styles.sidebarFooter}>
          <span className={styles.footerDot} />
          <span>Campus community</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
