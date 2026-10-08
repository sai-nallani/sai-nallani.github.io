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

const tiles = [
  { href: "/portfolio", title: "Portfolio", text: "Everything I've built" },
  { href: "/blog", title: "Words", text: "Notes and write-ups" },
  { href: "/courses", title: "Courses", text: "What I've studied" },
];

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Home() {
  const projects = projectsData.projects;
  const posts = [...postsData.posts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className={styles.main}>
      <section className={`${styles.card} ${styles.profile}`}>
        <div className={styles.portrait}>
          <img src="/images/picture.JPG" alt="Sai Nallani" />
        </div>
        <div className={styles.profileBody}>
          <span className={styles.eyebrow}>Princeton University · CS &amp; Math</span>
          <h1 className={styles.name}>Sai Nallani</h1>
          <p className={styles.bio}>
            I&apos;m a CS/Math major at Princeton University.
            I&apos;m interested in optimization, interpretability, robotics, and
            reinforcement learning.
          </p>
          <nav className={styles.links}>
            {links.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <a
                  key={link.text}
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel="noopener noreferrer"
                >
                  {link.text}
                  {external && <span className={styles.ext}>↗</span>}
                </a>
              );
            })}
          </nav>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h2>Projects</h2>
          <span className={styles.count}>{pad(projects.length)}</span>
        </header>
        <ul className={styles.rows}>
          {projects.map((project, i) => {
            const hasPage = Boolean(project.sections?.length);
            const body = (
              <>
                <span className={styles.index}>{pad(i + 1)}</span>
                <div className={styles.rowMain}>
                  <h3 className={styles.rowTitle}>{project.title}</h3>
                  <p className={styles.rowText}>{project.tagline}</p>
                  <div className={styles.tags}>
                    {project.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span className={styles.rowArrow}>{hasPage ? "→" : "↗"}</span>
              </>
            );
            return (
              <li key={project.slug}>
                {hasPage ? (
                  <Link href={`/portfolio/${project.slug}`} className={styles.row}>
                    {body}
                  </Link>
                ) : (
                  <a
                    href={project.links.live ?? project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.row}
                  >
                    {body}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h2>Writing</h2>
          <span className={styles.count}>{pad(posts.length)}</span>
        </header>
        <ul className={styles.rows}>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className={styles.row}>
                <span className={styles.date}>
                  {formatDate(post.date)}
                  {post.kind && <span className={styles.kind}>{post.kind}</span>}
                </span>
                <div className={styles.rowMain}>
                  <h3 className={styles.rowTitle}>{post.title}</h3>
                  <p className={styles.rowText}>{post.excerpt}</p>
                </div>
                {post.thumbnail ? (
                  <span className={styles.paper}>
                    <img src={post.thumbnail} alt="" />
                  </span>
                ) : (
                  <span className={styles.rowArrow}>→</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav className={styles.tiles}>
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className={styles.tile}>
            <span className={styles.tileTitle}>
              {tile.title}
              <span className={styles.rowArrow}>→</span>
            </span>
            <span className={styles.tileText}>{tile.text}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
