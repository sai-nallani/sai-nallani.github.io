import Link from "next/link";

interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
}

function formatDate(dateStr: string): string {
    const [year, month] = dateStr.split("-");
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export default function BlogCard({ post }: { post: Post }) {
    return (
        <article className="blog-post">
            <h3>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h3>
            <p className="blog-date">{formatDate(post.date)}</p>
            <p className="blog-excerpt">{post.excerpt}</p>
        </article>
    );
}
