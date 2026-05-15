'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

function setDevBypassCookie() {
  document.cookie = 'dev-bypass-auth=true; path=/; max-age=86400; SameSite=Lax';
}

export default function SignInPage() {
  const router = useRouter();
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(
      typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
    );
  }, []);

  const handleDevBypass = () => {
    setDevBypassCookie();
    router.push('/chat');
  };

  return (
    <div className="app-shell app-shell--center">
      <div className="app-auth-card">
        <h1 className="app-auth-title">CloudExtel Policy Assistant</h1>
        <p className="app-auth-sub">Sign in with your work account to continue</p>

        <button
          type="button"
          className="app-btn-azure"
          onClick={() => signIn('azure-ad', { callbackUrl: '/chat' })}
        >
          <svg width="21" height="21" viewBox="0 0 21 21" fill="currentColor" aria-hidden>
            <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" />
          </svg>
          Sign in with Azure AD
        </button>

        {isDev && (
          <div className="app-btn-dev-wrap">
            <p className="app-btn-dev-label">Development</p>
            <button type="button" className="app-btn-dev" onClick={handleDevBypass}>
              Bypass Authentication (Dev)
            </button>
          </div>
        )}

        <Link href="/" className="app-back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
