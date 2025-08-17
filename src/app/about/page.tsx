export const metadata = {
  title: 'About Me',
  description: 'Learn more about me',
};

export default function AboutPage() {
  return (
    <div className="prose dark:prose-invert max-w-2xl mx-auto py-10">
      <h1>About Me</h1>
      <p>
        Hi, I&apos;m <strong>Your Name</strong>. This site is a space where I write about
        software engineering, web performance, developer experience, and things I&apos;m
        learning. It&apos;s built with Next.js (App Router) + Tailwind CSS, and posts are
        authored in Markdown.
      </p>
      <p>
        Outside of coding, I enjoy reading, exploring new technologies, and
        contributing to open-source projects.
      </p>
      <p>
        You can adapt this page to include your own background, interests, resume
        links, or anything else you want visitors to know.
      </p>
    </div>
  );
}
