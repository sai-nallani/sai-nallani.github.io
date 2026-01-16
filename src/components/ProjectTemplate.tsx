"use client";

import { useState } from "react";
import Link from "next/link";
import Lightbox from "./Lightbox";

interface Section {
    type: "text" | "list";
    title: string;
    content?: string;
    items?: string[];
}

interface Project {
    slug: string;
    title: string;
    tagline: string;
    tags: string[];
    links: {
        live?: string;
        github?: string;
    };
    image?: string;
    video?: string;
    sections: Section[];
}

interface ProjectTemplateProps {
    project: Project;
}

export default function ProjectTemplate({ project }: ProjectTemplateProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const hasVideo = !!project.video;
    const hasImage = !!project.image;

    return (
        <main className="page">
            <div className="container container-wide">
                <section className="project-hero" style={{ paddingTop: "var(--space-lg)" }}>
                    <Link
                        href="/portfolio"
                        className="back-link"
                        style={{ marginBottom: "var(--space-lg)", display: "inline-block" }}
                    >
                        ← Portfolio
                    </Link>
                    <h1>{project.title}</h1>
                    <p>{project.tagline}</p>
                    <div className="project-meta">
                        {project.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                    <div className="project-links">
                        {project.links.live && (
                            <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="primary">
                                {project.links.live.includes("devpost") ? "Devpost" : "Live Demo"}
                            </a>
                        )}
                        {project.links.github && (
                            <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                                GitHub
                            </a>
                        )}
                    </div>
                </section>

                <section className="project-section">
                    {hasVideo && (
                        <div
                            style={{
                                position: "relative",
                                paddingBottom: "56.25%",
                                height: 0,
                                overflow: "hidden",
                                marginBottom: "var(--space-xl)",
                                borderRadius: "8px",
                            }}
                        >
                            <iframe
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    borderRadius: "8px",
                                }}
                                src={project.video}
                                title={`${project.title} Demo`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    <div className={hasImage && !hasVideo ? "project-grid" : ""}>
                        <div className="project-content">
                            {project.sections.map((section, index) => (
                                <div key={index}>
                                    <h2>{section.title}</h2>
                                    {section.type === "text" && <p>{section.content}</p>}
                                    {section.type === "list" && (
                                        <ul>
                                            {section.items?.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                        {hasImage && !hasVideo && (
                            <div className="project-image">
                                <img
                                    src={project.image}
                                    alt={`${project.title} interface`}
                                    onClick={() => setLightboxOpen(true)}
                                />
                                <span className="click-hint">Click to enlarge</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {hasImage && (
                <Lightbox
                    src={project.image!}
                    alt={`${project.title} interface`}
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </main>
    );
}
