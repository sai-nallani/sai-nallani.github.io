import Link from 'next/link';
import { getAllPostsMeta } from '@/lib/posts';

export const metadata = {
  title: 'Blog',
  description: 'Writing and notes',
};

export default async function BlogIndex() {
  const posts = await getAllPostsMeta();
  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-10">Blog</h1>
      <ul className="space-y-8">
        {posts.map(post => (
          <li key={post.slug} className="group">
            <Link href={`/blog/${post.slug}`} className="block">
              <h2 className="text-2xl font-semibold group-hover:underline">{post.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(post.date).toLocaleDateString()}</p>
              {post.description && (
                <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{post.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-16 text-sm"><Link href="/">← Back to home</Link></p>
    </div>
  );
}
