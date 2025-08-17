import { getAllPostsMeta } from '@/lib/posts';
import Link from 'next/link';

export async function BlogSection() {
  const posts = await getAllPostsMeta();
  if (!posts.length) return null;
  return (
    <section id="blog" className="max-w-3xl mx-auto px-4 py-24 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-3xl font-semibold mb-10">Latest Writing</h2>
      <div className="space-y-16">
        {posts.map(post => (
          <article key={post.slug} className="group">
            <header className="mb-4">
              <h3 className="text-2xl font-bold leading-snug">
                <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(post.date).toLocaleDateString()}</p>
            </header>
            {post.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 max-w-prose">
                {post.description}
              </p>
            )}
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center text-sm font-medium underline underline-offset-4 hover:no-underline"
            >
              Read more →
            </Link>
          </article>
        ))}
      </div>
      {posts.length > 5 && (
        <p className="mt-12 text-xs text-gray-500 dark:text-gray-400">Showing {posts.length} posts.</p>
      )}
    </section>
  );
}
