import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: 24,
  },
  card: {
    maxWidth: 380,
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 32,
  },
  button: {
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
  },
  buttonHover: {
    backgroundColor: '#1d4ed8',
  },
  logo: {
    width: 24,
    height: 24,
  },
  error: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    border: '1px solid #dc2626',
    borderRadius: 8,
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'left',
  },
};

const MicrosoftLogo = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="currentColor" style={styles.logo}>
    <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" />
  </svg>
);

export default function LoginPage() {
  const { instance, inProgress } = useMsal();
  const [error, setError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsRedirecting(true);
    try {
      await instance.loginRedirect({ scopes: ['openid', 'profile'] });
      // If we get here, redirect didn't happen (e.g. popup blocked). loginRedirect usually navigates away.
    } catch (e) {
      setIsRedirecting(false);
      const msg = e?.message || e?.errorMessage || String(e);
      setError(msg || 'Login failed');
      console.error('Login error:', e);
    }
  };

  if (inProgress === 'login' || isRedirecting) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ color: '#888' }}>Signing you in...</p>
          <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>You may be redirected to Microsoft.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>CloudExtel Policy Assistant</h1>
        <p style={styles.subtitle}>Sign in with your work account to continue</p>
        <button
          type="button"
          onClick={handleLogin}
          style={styles.button}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = styles.button.backgroundColor;
          }}
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </button>
        {error && (
          <div style={styles.error} role="alert">
            {error}
            {error.includes('redirect_uri') && (
              <div style={{ marginTop: 8 }}>
                Add <strong>http://localhost:5174</strong> (and your production URL) to Redirect URIs in Azure AD → App registration → Authentication.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { MicrosoftLogo };
