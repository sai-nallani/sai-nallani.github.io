import Link from "next/link";
import type { Metadata } from "next";
import styles from "./courses.module.css";

export const metadata: Metadata = {
    title: "Coursework",
    description: "Coursework by Sai Nallani",
};

const courses = {
    princeton: [
        { code: "COS 217", name: "Systems Programming" },
        { code: "COS 226", name: "Data Structures and Algorithms" },
        { code: "COS 486", name: "Introduction to Neural Emulation" },
        { code: "MAT 216", name: "Multivariable Analysis and Linear Algebra I" },
        { code: "MAT 218", name: "Multivariable Analysis and Linear Algebra II" },
    ],
    other: [
        { code: "--", name: "Measure Theory", links: [{ href: "/mt-paper.pdf", text: "paper" }, { href: "/mt-slides.pdf", text: "slides" }] },
        { code: "--", name: "Combinatorial Game Theory", links: [{ href: "/cgt-paper.pdf", text: "paper" }] },
        { code: "MATH 4110", name: "Abstract Algebra I" },
        { code: "MATH 4120", name: "Abstract Algebra II" },
        { code: "MATH 4560", name: "Number Theory & Cryptography" },
    ],
};

export default function Courses() {
    return (
        <main className="page">
            <div className="container">
                <header className="page-header" style={{ paddingTop: "var(--space-lg)" }}>
                    <Link
                        href="/"
                        className="back-link"
                        style={{ marginBottom: "var(--space-lg)", display: "inline-block" }}
                    >
                        ← Back
                    </Link>
                    <h1>Coursework</h1>
                </header>

                <section className="content">
                    <div className={styles.coursework}>
                        <div className={styles.courseCategory}>
                            <h3>Princeton University</h3>
                            <ul className={styles.courseList}>
                                {courses.princeton.map((course) => (
                                    <li key={course.code + course.name}>
                                        <span className={styles.courseCode}>{course.code}</span>
                                        <span className={styles.courseName}>{course.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.courseCategory}>
                            <h3>Euler Circle + University of Nebraska Omaha</h3>
                            <ul className={styles.courseList}>
                                {courses.other.map((course) => (
                                    <li key={course.code + course.name}>
                                        <span className={styles.courseCode}>{course.code}</span>
                                        <span className={styles.courseName}>
                                            {course.name}
                                            {course.links && course.links.length > 0 && (
                                                <span className={styles.courseLinks}>
                                                    {" ("}
                                                    {course.links.map((link, i) => (
                                                        <span key={link.href}>
                                                            <a href={link.href}>{link.text}</a>
                                                            {i < course.links.length - 1 && " / "}
                                                        </span>
                                                    ))}
                                                    {")"}
                                                </span>
                                            )}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
