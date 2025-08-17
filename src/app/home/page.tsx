import { Hero } from '@/components/Hero';
import { AboutSection } from '@/components/AboutSection';
import { BlogSection } from '@/components/BlogSection';
import { ContactSection } from '@/components/ContactSection';

export const dynamic = 'force-static';

export default function HomeComposite() {
  return (
    <>
      <Hero />
      <AboutSection />
      <BlogSection />
      <ContactSection />
    </>
  );
}
