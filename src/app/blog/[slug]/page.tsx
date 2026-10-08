import { notFound } from "next/navigation";
import Link from "next/link";
import postsData from "@/data/posts.json";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { parseMarkdown } from "@/lib/markdown";
import "katex/dist/katex.min.css";
import WaveTraySim from "@/components/WaveTraySim";

// Interactive pieces a post can place on a line of its own, as {{name}}
const embeds: Record<string, () => React.ReactElement> = {
    "wave-tray": () => <WaveTraySim />,
};

function renderContent(content: string) {
    return content.split(/^\{\{([\w-]+)\}\}$/m).map((part, i) => {
        if (i % 2 === 0) {
            return part.trim()
                ? <div key={i} dangerouslySetInnerHTML={{ __html: parseMarkdown(part) }} />
                : null;
        }
        const Embed = embeds[part];
        return Embed ? <Embed key={i} /> : null;
    });
}

interface Props {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return postsData.posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = postsData.posts.find((p) => p.slug === slug);

    if (!post) return { title: "Post Not Found" };

    return { title: post.title, description: post.excerpt };
}

function getPostContent(slug: string): string | null {
    try {
        const filePath = path.join(process.cwd(), "content", "posts", `${slug}.mdx`);
        const content = fs.readFileSync(filePath, "utf8");
        return content.replace(/^---[\s\S]*?---\n*/, "");
    } catch {
        return null;
    }
}

function formatDate(dateStr: string): string {
    const [year, month] = dateStr.split("-");
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export default async function BlogPost({ params }: Props) {
    const { slug } = await params;
    const post = postsData.posts.find((p) => p.slug === slug);

    if (!post) notFound();

    const content = getPostContent(slug);

    return (
        <main className="page">
            <div className="container">
                <header className="page-header">
                    <Link href="/blog" className="back-link">← Words</Link>
                </header>

                <article className="blog-content">
                    <header className="blog-header">
                        <h1>{post.title}</h1>
                        <p className="blog-meta">
                            {post.kind ? `${post.kind} · ` : ""}{formatDate(post.date)}
                        </p>
                    </header>

                    {post.pdf && (
                        <aside className="paper-panel">
                            {post.thumbnail && (
                                <a href={post.pdf} target="_blank" rel="noopener noreferrer" className="paper-thumb">
                                    <img src={post.thumbnail} alt={`First page of ${post.title}`} />
                                </a>
                            )}
                            <div className="project-links">
                                <a href={post.pdf} target="_blank" rel="noopener noreferrer" className="primary">
                                    Read the paper ↗
                                </a>
                                {post.slides && (
                                    <a href={post.slides} target="_blank" rel="noopener noreferrer">
                                        Slides ↗
                                    </a>
                                )}
                            </div>
                        </aside>
                    )}

                    {content ? (
                        renderContent(content)
                    ) : (
                        <p>Content coming soon...</p>
                    )}
                </article>
            </div>
        </main>
    );
}
