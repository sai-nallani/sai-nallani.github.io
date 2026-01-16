import { notFound } from "next/navigation";
import Link from "next/link";
import postsData from "@/data/posts.json";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";

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

function parseMarkdown(text: string): string {
    return text
        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
        .replace(/^# (.*$)/gm, "<h2>$1</h2>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/^(?!<[hp])(.*\S.*)$/gm, "<p>$1</p>")
        .replace(/<p><\/p>/g, "");
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
                        <p className="blog-meta">{formatDate(post.date)}</p>
                    </header>

                    {content ? (
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                    ) : (
                        <p>Content coming soon...</p>
                    )}
                </article>
            </div>
        </main>
    );
}
