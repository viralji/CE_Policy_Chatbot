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
    setIsDev(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));
  }, []);

  const handleDevBypass = () => {
    setDevBypassCookie();
    router.push('/chat');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>CloudExtel Policy Assistant</h1>
        <p style={{ color: '#888', fontSize: 14, marginBottom: 32 }}>Sign in with your work account to continue</p>

        <button
          type="button"
          onClick={() => signIn('azure-ad', { callbackUrl: '/chat' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <svg width="21" height="21" viewBox="0 0 21 21" fill="currentColor">
            <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" />
          </svg>
          Sign in with Azure AD
        </button>

        {isDev && (
          <>
            <div style={{ borderTop: '1px solid #333', marginTop: 24, paddingTop: 24 }}>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Development</p>
              <button
                type="button"
                onClick={handleDevBypass}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: '#b45309',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Bypass Authentication (Dev)
              </button>
            </div>
          </>
        )}

        <p style={{ marginTop: 24 }}>
          <Link href="/" style={{ fontSize: 14, color: '#3b82f6', textDecoration: 'none' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
