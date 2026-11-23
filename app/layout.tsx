import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Close Desk: November close for a fictional SaaS company',
  description: 'Independent demo: rule-based transaction categorization, bank-to-ledger reconciliation with an exception queue, and a close checklist with an audit trail. Sample books are fictional; not affiliated with Billow.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="min-h-screen font-sans antialiased">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
          <Link href="/" className="text-base font-semibold text-ink">Close Desk <span className="font-normal text-mute">independent demo</span></Link>
          <nav className="flex gap-5 text-sm"><Link className="text-ink hover:text-accent" href="/">November close</Link></nav>
        </header>
        {children}
        <footer className="mt-12 border-t border-line py-5 text-xs leading-relaxed text-mute">
          Demo built by Vinil Polepalli. The company, ledger and bank feed are fictional sample data; categorization is explicit vendor rules, not machine learning. Recategorizations, exception resolutions and checklist progress are stored in this demo's database under an anonymous browser cookie, with an audit trail recording each change. Independent demo; not affiliated with or endorsed by Billow.
        </footer>
      </div>
    </body></html>
  );
}
