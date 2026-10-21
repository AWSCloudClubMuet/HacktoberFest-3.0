
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import styles from "./AppLayout.module.css";

function AppLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.content}>
        <Navbar />
        <main className={styles.page}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
