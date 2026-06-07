import { useState, FormEvent } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

export default function LoginScreen() {
  const { signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState(isSupabaseConfigured ? '' : 'owner@thecore.agency');
  const [password, setPassword] = useState(isSupabaseConfigured ? '' : 'demo1234');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) setLocalError(signInError);
    setSubmitting(false);
  };

  const displayError = localError ?? error;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0a0a0f)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '"Plus Jakarta Sans", "Outfit", sans-serif',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #fff 30%, #a1a1aa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          THE CORE AGENCY
        </h1>
        <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '6px' }}>
          AI Marketing Team Workspace
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '32px',
      }}>

        {/* Unconfigured banner */}
        {!isSupabaseConfigured && (
          <div style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <div>
              <p style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                Supabase not configured
              </p>
              <p style={{ color: '#a16207', fontSize: '0.75rem', margin: '4px 0 0' }}>
                Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable real auth.
                Demo credentials are pre-filled.
              </p>
            </div>
          </div>
        )}

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#f4f4f5',
          margin: '0 0 24px',
        }}>
          {isSupabaseConfigured ? 'Sign in' : 'Demo Sign In'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@thecore.agency"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f4f4f5',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f4f4f5',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            />
          </div>

          {/* Error */}
          {displayError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.8rem',
            }}>
              {displayError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || loading}
            style={{
              background: submitting || loading
                ? 'rgba(99,102,241,0.4)'
                : 'rgba(99,102,241,0.8)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: submitting || loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginTop: '4px',
            }}
          >
            {submitting || loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo hint */}
        {!isSupabaseConfigured && (
          <p style={{
            textAlign: 'center',
            color: '#52525b',
            fontSize: '0.75rem',
            marginTop: '20px',
          }}>
            Demo: owner@thecore.agency / demo1234
          </p>
        )}
      </div>

      {/* Footer */}
      <p style={{ color: '#3f3f46', fontSize: '0.72rem', marginTop: '32px' }}>
        © The Core Agency — Real Operations MVP
      </p>
    </div>
  );
}
