import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-lg)" }}>
      <div className={styles.card}>
        <header className={styles.cardHeader}>
          <h1 className={styles.cardName}>Sai Nallani</h1>
          <SocialLinks />
        </header>

        <div className={styles.cardContent}>
          <div className={styles.cardBio}>
            <p>
              I&apos;m a Freshman at Princeton University, majoring in CS and Math.
              I&apos;m interested in optimization, interpretability, robotics, and reinforcement learning.
            </p>
          </div>
          <div className={styles.cardImage}>
            <img src="/images/picture.JPG" alt="Sai Nallani" />
          </div>
        </div>

        <nav className={styles.cardNav}>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/blog">Words</Link>
          <Link href="/courses">Courses</Link>
        </nav>
      </div>
    </main>
  );
}
