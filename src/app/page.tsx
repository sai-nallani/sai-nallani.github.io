import Link from "next/link";
import projectsData from "@/data/projects.json";
import postsData from "@/data/posts.json";
import styles from "./page.module.css";

const links = [
  { href: "https://github.com/sai-nallani", text: "GitHub" },
  { href: "https://www.linkedin.com/in/sai-nallani-6a5061262/", text: "LinkedIn" },
  { href: "https://x.com/nchsai1", text: "X" },
  { href: "mailto:sainallani@princeton.edu", text: "Email" },
];

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const posts = [...postsData.posts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className={styles.main}>
      <header className={styles.intro}>
        <div className={styles.avatar}>
          <img src="/images/picture.JPG" alt="Sai Nallani" />
        </div>
        <h1 className={styles.name}>Sai Nallani</h1>
        <nav className={styles.links}>
          {links.map((link) => (
            <a
              key={link.text}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
            >
              {link.text}
              {link.href.startsWith("http") && <span className={styles.arrow}>↗</span>}
            </a>
          ))}
        </nav>
        <p className={styles.bio}>
          I&apos;m a Freshman at Princeton University, majoring in CS and Math.
          I&apos;m interested in optimization, interpretability, robotics, and
          reinforcement learning.
        </p>
      </header>

      <div className={styles.divider} aria-hidden="true">* * *</div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Projects</h2>
        <ul className={styles.list}>
          {projectsData.projects.map((project) => (
            <li key={project.slug} className={styles.item}>
              {project.sections?.length ? (
                <Link href={`/portfolio/${project.slug}`} className={styles.itemTitle}>
                  {project.title}
                </Link>
              ) : (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.itemTitle}
                >
                  {project.title}
                  <span className={styles.arrow}>↗</span>
                </a>
              )}
              <p className={styles.itemText}>{project.tagline}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.divider} aria-hidden="true">* * *</div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Writing</h2>
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug} className={styles.item}>
              <Link href={`/blog/${post.slug}`} className={styles.itemTitle}>
                {post.title}
              </Link>
              <span className={styles.itemDate}>{formatDate(post.date)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.divider} aria-hidden="true">* * *</div>

      <footer className={styles.footer}>
        <Link href="/portfolio">Portfolio</Link>
        <span>·</span>
        <Link href="/blog">Words</Link>
        <span>·</span>
        <Link href="/courses">Courses</Link>
      </footer>
    </main>
  );
}
