export function Hero() {
  return (
    <section id="home" className="max-w-4xl mx-auto px-4 py-24">
      <h1 className="text-5xl font-bold tracking-tight mb-6">Hi, I&apos;m Sai.</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
        Welcome :) 

        I&apos;m a freshman at Princeton University studying computer science and mathematics.
      </p>
      <div className="mt-10 flex gap-4">
        <a href="#about" className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-5 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">About</a>
        <a href="#blog" className="inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm font-medium hover:opacity-90 transition">Latest Posts</a>
      </div>
    </section>
  );
}
