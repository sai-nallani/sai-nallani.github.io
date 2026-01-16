import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import projectsData from "@/data/projects.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Portfolio",
    description: "Projects by Sai Nallani",
};

export default function Portfolio() {
    return (
        <main className="page">
            <div className="container">
                <header className="page-header">
                    <Link href="/" className="back-link">
                        ← Back
                    </Link>
                    <h1>Portfolio</h1>
                </header>

                <section className="content">
                    <div className="projects-grid">
                        {projectsData.projects.map((project) => (
                            <ProjectCard key={project.slug} project={project} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
