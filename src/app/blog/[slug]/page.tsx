import { getAllPostSlugs, getPostBySlug } from '@/lib/posts';
import type { Metadata } from 'next';
import Link from 'next/link';

interface Params { slug: string }

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map(slug => ({ slug }));
}

// In Next.js 15 dynamic APIs, params can be a Promise and must be awaited before property access.
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return <div className="max-w-3xl mx-auto py-16 px-4">Post not found.</div>;
  return (
    <article className="prose dark:prose-invert max-w-3xl mx-auto py-16 px-4">
      <p className="text-sm mb-6"><Link href="/blog" className="no-underline">← All posts</Link> · <Link href="/" className="no-underline">Home</Link></p>
      <h1 className="text-4xl font-bold tracking-tight leading-tight mb-3">{post.title}</h1>
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{new Date(post.date).toLocaleDateString()}</p>
      {post.description && <p className="italic text-lg text-gray-300 dark:text-gray-300 mb-8 max-w-prose">{post.description}</p>}
      <div className="mt-4 space-y-4" dangerouslySetInnerHTML={{ __html: post.html }} />
    </article>
  );
}
