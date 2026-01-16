import { notFound } from "next/navigation";
import ProjectTemplate from "@/components/ProjectTemplate";
import projectsData from "@/data/projects.json";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    // Only generate pages for projects that have sections
    return projectsData.projects
        .filter((project) => project.sections && project.sections.length > 0)
        .map((project) => ({
            slug: project.slug,
        }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const project = projectsData.projects.find((p) => p.slug === slug);

    if (!project) {
        return { title: "Project Not Found" };
    }

    return {
        title: project.title,
        description: project.tagline,
    };
}

export default async function ProjectPage({ params }: Props) {
    const { slug } = await params;
    const project = projectsData.projects.find((p) => p.slug === slug);

    if (!project || !project.sections || project.sections.length === 0) {
        notFound();
    }

    return <ProjectTemplate project={project as Parameters<typeof ProjectTemplate>[0]["project"]} />;
}
