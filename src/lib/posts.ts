import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import rehypeKatex from 'rehype-katex';
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export interface PostMeta {
  slug: string;
  title: string;
  date: string; // ISO date
  description?: string;
  tags?: string[];
}

export interface Post extends PostMeta {
  content: string; // raw markdown
  html: string; // processed html
}

const postsDir = path.join(process.cwd(), 'content', 'posts');
const POSTS_DEBUG = false;
const dlog = (...args: unknown[]) => { if (POSTS_DEBUG) console.log('[posts]', ...args); };

export async function getPostSlugs(): Promise<string[]> {
  const entries = await fs.readdir(postsDir);
  return entries.filter(f => f.endsWith('.md'));
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  const files = await getPostSlugs();
  const posts: PostMeta[] = [];
  for (const file of files) {
    const full = await fs.readFile(path.join(postsDir, file), 'utf8');
    const { data } = matter(full);
    if (!data.slug) data.slug = file.replace(/\.md$/, '');
    posts.push({
      slug: data.slug,
      title: data.title ?? data.slug,
      date: data.date ?? new Date().toISOString(),
      description: data.description,
      tags: data.tags ?? [],
    });
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  dlog('getPostBySlug()', { slug });
  const filePath = path.join(postsDir, `${slug}.md`);
  dlog('Attempt direct path', filePath);
  const buildPost = async (source: string, fallbackSlug: string) => {
    const { content, data } = matter(source);
    const processed = await unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);
    dlog('Built post', {
      slug: (data.slug as string) ?? fallbackSlug,
      title: (data.title as string) ?? fallbackSlug,
    });
    return {
      slug: (data.slug as string) ?? fallbackSlug,
      title: (data.title as string) ?? fallbackSlug,
      date: (data.date as string) ?? new Date().toISOString(),
      description: data.description as string | undefined,
      tags: (data.tags as string[]) ?? [],
      content,
      html: String(processed),
    } as Post;
  };

  try {
    const source = await fs.readFile(filePath, 'utf8');
    dlog('Direct file read success');
    return await buildPost(source, slug);
  } catch (e) {
    dlog('Direct file read failed', { error: (e as Error).message });
    // Fallback: scan all files to match frontmatter slug (handles filename mismatch)
    try {
      const files = await getPostSlugs();
      dlog('Scanning files', files);
      for (const file of files) {
        const full = await fs.readFile(path.join(postsDir, file), 'utf8');
        const { data } = matter(full);
        const frontSlug = (data.slug as string) ?? file.replace(/\.md$/, '');
        dlog('Check file', { file, frontSlug });
        if (frontSlug === slug) {
          dlog('Matched via frontmatter', { file });
          return await buildPost(full, frontSlug);
        }
      }
    } catch (inner) {
      // ignore secondary errors
      dlog('Fallback scan error', { error: (inner as Error).message });
    }
    dlog('No post found for slug', { slug });
    return null;
  }
}

export async function getAllPostSlugs(): Promise<string[]> {
  const meta = await getAllPostsMeta();
  return meta.map(m => m.slug);
}
