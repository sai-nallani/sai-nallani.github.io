import Link from "next/link";

interface Project {
    slug: string;
    title: string;
    tagline: string;
    tags: string[];
    links: {
        live?: string;
        github?: string;
    };
    sections?: unknown[];
}

interface ProjectCardProps {
    project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const hasPage = project.sections && project.sections.length > 0;
    const href = hasPage ? `/portfolio/${project.slug}` : project.links.live;
    const isExternal = !hasPage;

    const content = (
        <>
            <h3>{project.title}</h3>
            <p>{project.tagline}</p>
            <div className="project-tags">
                {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                ))}
            </div>
            <span className="project-link">
                {isExternal ? "Visit Site →" : "View Project →"}
            </span>
        </>
    );

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-card"
            >
                {content}
            </a>
        );
    }

    return (
        <Link href={href!} className="project-card">
            {content}
        </Link>
    );
}
