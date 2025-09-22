'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PointsDisplay from './PointsDisplay';

export default function HeaderWithPoints() {
  const pathname = usePathname() || '';

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        StudyConnect
      </Link>
      <nav className="space-x-4">
        <Link href="/questions" className={pathname.startsWith('/questions') ? 'font-semibold' : ''}>
          Questions
        </Link>
        <Link href="/ask" className={pathname === '/ask' ? 'font-semibold' : ''}>
          Ask
        </Link>
        <Link href="/community" className={pathname === '/community' ? 'font-semibold' : ''}>
          Community
        </Link>
        <Link href="/groups" className={pathname === '/groups' ? 'font-semibold' : ''}>
          Groups
        </Link>
        <Link href="/profile" className={pathname === '/profile' ? 'font-semibold' : ''}>
          Profile
        </Link>
      </nav>
      <div className="flex items-center">
        <PointsDisplay showRank={true} size="sm" />
      </div>
    </header>
  );
}
