'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user) {
      router.replace('/chat');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="app-shell app-shell--center">
        <p className="app-muted">Loading…</p>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="app-shell app-shell--center">
        <p className="app-muted">Opening chat…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-shell-header">
        <div className="app-shell-header-inner">
          <span className="app-shell-brand">CloudExtel Policy Assistant</span>
          <Link href="/signin" className="app-shell-link">
            Sign In
          </Link>
        </div>
      </header>
      <main className="app-shell-main">
        <p className="app-shell-lead">
          Ask questions about company policies, handbook, and guidelines.
        </p>
        <Link href="/signin" className="app-btn-primary">
          Get Started
        </Link>
      </main>
    </div>
  );
}
