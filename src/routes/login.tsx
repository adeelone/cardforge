import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Cloud, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { cloudEnabled, getSupabase } from '../lib/cloud/client';
import { useSession } from '../lib/cloud/session';
import { shareBase } from '../exporters/share-link';
import { toast } from '../lib/toast';
import { safeNext } from '../lib/redirect';

type Mode = 'sign-in' | 'sign-up' | 'magic' | 'reset';

const COPY: Record<Mode, { title: string; action: string }> = {
  'sign-in': { title: 'Welcome back', action: 'Sign in' },
  'sign-up': { title: 'Create your account', action: 'Create account' },
  magic: { title: 'Sign in with an email link', action: 'Email me a link' },
  reset: { title: 'Reset your password', action: 'Send reset link' }
};

function friendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match an account.';
  if (/email not confirmed/i.test(message)) return 'Confirm your email first — check your inbox for the link.';
  if (/already registered|already exists/i.test(message)) return 'An account with that email already exists. Sign in instead.';
  if (/password/i.test(message) && /characters|weak|short/i.test(message)) return 'Choose a stronger password (at least 8 characters).';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  if (/sending.*email|smtp/i.test(message)) return 'We couldn’t send the email right now. Try again shortly.';
  return message || 'Something went wrong. Try again.';
}

export function LoginRoute() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = useSession((state) => state.status);
  const start = useSession((state) => state.start);
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const next = safeNext(params.get('next'));

  useEffect(() => {
    void start();
  }, [start]);

  if (!cloudEnabled) {
    return (
      <main className="page auth-page">
        <section className="auth-card">
          <Cloud size={26} />
          <h1>Accounts aren’t enabled here</h1>
          <p className="muted">This deployment runs CardForge in local-only mode. Everything still works and saves in your browser.</p>
          <Link to="/new" className="primary-button">Open the editor</Link>
        </section>
      </main>
    );
  }

  if (status === 'signed-in') return <Navigate to={next} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSent('');
    try {
      const supabase = await getSupabase();
      const redirect = `${shareBase()}${next}`;
      if (mode === 'sign-in') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        toast('Signed in');
        navigate(next, { replace: true });
      } else if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirect, data: { display_name: name.trim().slice(0, 120) } }
        });
        if (authError) throw authError;
        if (data.session) {
          toast('Account created');
          navigate(next, { replace: true });
        } else {
          setSent(`We sent a confirmation link to ${email}. Open it to finish creating your account.`);
        }
      } else if (mode === 'magic') {
        const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
        if (authError) throw authError;
        setSent(`Check ${email} for a sign-in link.`);
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${shareBase()}/account?reset=1` });
        if (authError) throw authError;
        setSent(`If an account exists for ${email}, a reset link is on its way.`);
      }
    } catch (caught) {
      setError(friendlyAuthError(caught instanceof Error ? caught.message : String(caught)));
    } finally {
      setBusy(false);
    }
  }

  const needsPassword = mode === 'sign-in' || mode === 'sign-up';

  return (
    <main className="page auth-page">
      <section className="auth-card">
        <span className="auth-mark" aria-hidden="true"><Cloud size={22} /></span>
        <h1>{COPY[mode].title}</h1>
        <p className="muted">Sync cards across devices, publish short links you control, and see who’s viewing.</p>

        {mode === 'sign-in' || mode === 'sign-up' ? (
          <div className="segmented auth-tabs" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={mode === 'sign-in'} className={mode === 'sign-in' ? 'seg on' : 'seg'} onClick={() => setMode('sign-in')}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'sign-up'} className={mode === 'sign-up' ? 'seg on' : 'seg'} onClick={() => setMode('sign-up')}>Create account</button>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          {mode === 'sign-up' ? (
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} /></label>
          ) : null}
          <label>Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
          {needsPassword ? (
            <label>
              Password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              />
            </label>
          ) : null}
          {error ? <p className="field-error" role="alert">{error}</p> : null}
          {sent ? <p className="auth-sent" role="status"><Mail size={15} /> {sent}</p> : null}
          <button type="submit" className="primary-button large" disabled={busy}>{busy ? 'Working…' : COPY[mode].action}</button>
        </form>

        <div className="auth-alt">
          {mode !== 'magic' ? <button type="button" className="text-link" onClick={() => setMode('magic')}><Mail size={14} />Email me a sign-in link</button> : null}
          {mode === 'sign-in' ? <button type="button" className="text-link" onClick={() => setMode('reset')}><KeyRound size={14} />Forgot password?</button> : null}
          {mode === 'magic' || mode === 'reset' ? <button type="button" className="text-link" onClick={() => setMode('sign-in')}>Back to password sign-in</button> : null}
        </div>

        <p className="auth-foot"><ShieldCheck size={14} /> No account is needed to design, print, or share. Your local cards stay on this device until you choose to sync them. See our <Link to="/privacy">privacy notice</Link>.</p>
      </section>
    </main>
  );
}
