"use client";

import { useState, useEffect } from 'react';

export function ContactSection() {
  const email = 'sainallani@princeton.edu';
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2200);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const copyEmail = async () => {
    setError(null);
    try {
      if (!navigator?.clipboard?.writeText) {
        setError('Clipboard unsupported');
        return;
      }
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      setError('Copy failed');
    }
  };

  return (
    <section id="contact" className="relative max-w-3xl mx-auto px-4 py-24 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-3xl font-semibold mb-6">Get in Touch</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">Feel free to reach out if you&apos;d like to chat or collaborate.</p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span>Email:</span>
          <button
            type="button"
            onClick={copyEmail}
            className="underline decoration-dotted hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
            aria-live="polite"
          >
            {email}
          </button>
          <span className="sr-only">(click to copy)</span>
        </li>
        <li>GitHub: <a href="https://github.com/sai-nallani" className="underline" target="_blank" rel="noreferrer">sai-nallani</a></li>
        <li>LinkedIn: <a href="https://www.linkedin.com/in/sai-nallani-6a5061262/" className="underline" target="_blank" rel="noreferrer">/in/sai-nallani</a></li>
      </ul>

      {/* Toast */}
      <div
        aria-live="polite"
        className={
          `pointer-events-none select-none fixed left-1/2 bottom-8 -translate-x-1/2 px-4 py-2 rounded-md text-sm font-medium shadow
          transition-all duration-300
          ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
          ${error ? 'bg-red-600 text-white' : 'bg-black/80 dark:bg-white/80 dark:text-black text-white'}`
        }
      >
        {error ? error : 'Email copied!'}
      </div>
    </section>
  );
}
