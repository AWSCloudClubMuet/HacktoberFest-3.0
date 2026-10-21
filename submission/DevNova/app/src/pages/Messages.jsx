
import { MessageCircle, Search, Users } from "lucide-react";
import styles from "./Messages.module.css";

function Messages() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>STAY CONNECTED</span>
          <h1>Messages</h1>
          <p>Connect with students and collaborate on campus projects.</p>
        </div>
        <div className={styles.headerIcon}>
          <MessageCircle size={25} />
        </div>
      </header>

      <section className={styles.messagePanel}>
        <div className={styles.illustration}>
          <div className={styles.iconCircle}>
            <MessageCircle size={35} />
          </div>
          <span className={styles.smallBubble}>
            <Users size={19} />
          </span>
        </div>

        <h2>Your conversations start here</h2>
        <p>
          Once you connect with other students through campus gigs,
          you can use this space to stay organized and collaborate.
        </p>

        <div className={styles.searchHint}>
          <Search size={17} />
          <span>Explore opportunities to find collaborators</span>
        </div>
      </section>

      <div className={styles.tip}>
        <div className={styles.tipIcon}>
          <Users size={19} />
        </div>
        <div>
          <strong>Build your campus network</strong>
          <p>
            Discover talented students, share your skills, and work
            together on meaningful projects.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Messages;
