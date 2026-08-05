import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/**
 * Marketing chrome — the public site's header and footer.
 *
 * Wraps only the apex routes: homepage, programs, solutions, etc. The dashboards
 * (learning/admin) have their own Shell and live outside this group.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
