import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import postsData from "@/data/posts.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Words",
    description: "Blog posts by Sai Nallani",
};

export default function Blog() {
    return (
        <main className="page">
            <div className="container">
                <header className="page-header">
                    <Link href="/" className="back-link">
                        ← Back
                    </Link>
                    <h1>Words</h1>
                </header>

                <section className="content">
                    <div className="blog-list">
                        {postsData.posts.map((post) => (
                            <BlogCard key={post.slug} post={post} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
