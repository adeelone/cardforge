import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, CreditCard, ExternalLink, Eye, LogOut, Receipt, Trash2, UserRound } from 'lucide-react';
import { cloudEnabled, getSupabase } from '../lib/cloud/client';
import { useSession } from '../lib/cloud/session';
import {
  cardAnalytics,
  deleteAccount,
  deletePublishedCard,
  isCardExpired,
  isCardLive,
  listBillingEvents,
  listPublishedCards,
  setCardActive,
  setSubscriptionCancel,
  signOut,
  updateDisplayName,
  type BillingEvent,
  type PublishedCard
} from '../lib/cloud/api';
import { cloudErrorMessage, formatPrice, PLANS } from '../lib/plans';
import { hostedCardUrl } from '../exporters/share-link';
import { toast } from '../lib/toast';

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const ratio = limit > 0 ? Math.min(1, used / limit) : 1;
  return (
    <div className="meter">
      <div className="meter-label"><span>{label}</span><span>{used} / {limit}</span></div>
      <div className="meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
        <span style={{ width: `${ratio * 100}%` }} className={ratio >= 1 ? 'full' : ''} />
      </div>
    </div>
  );
}

function ViewsChart({ cardId }: { cardId: string }) {
  const [rows, setRows] = useState<{ day: string; views: number }[] | null>(null);
  useEffect(() => {
    cardAnalytics(cardId, 30).then(setRows).catch(() => setRows([]));
  }, [cardId]);
  if (!rows) return <p className="muted">Loading views…</p>;
  if (!rows.length) return null;
  const max = Math.max(1, ...rows.map((row) => row.views));
  const total = rows.reduce((sum, row) => sum + row.views, 0);
  return (
    <figure className="views-chart">
      <div className="views-bars" role="img" aria-label={`${total} views in the last 30 days`}>
        {rows.map((row) => (
          <span key={row.day} title={`${row.day}: ${row.views} views`} style={{ height: `${Math.max(4, (row.views / max) * 100)}%` }} className={row.views ? '' : 'zero'} />
        ))}
      </div>
      <figcaption>{total.toLocaleString()} views in the last 30 days · peak {max.toLocaleString()} in a day</figcaption>
    </figure>
  );
}

function billingLabel(event: BillingEvent) {
  const plan = PLANS[event.plan].name;
  if (event.kind === 'subscribed') return `Subscribed to ${plan}`;
  if (event.kind === 'changed') return `Changed plan to ${plan}`;
  if (event.kind === 'canceled') return `Scheduled cancellation of ${plan}`;
  return `Resumed ${plan}`;
}

export function AccountRoute() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = useSession((state) => state.status);
  const user = useSession((state) => state.user);
  const overview = useSession((state) => state.overview);
  const recovering = useSession((state) => state.recovering);
  const clearRecovering = useSession((state) => state.clearRecovering);
  const start = useSession((state) => state.start);
  const refreshOverview = useSession((state) => state.refreshOverview);
  const [cards, setCards] = useState<PublishedCard[]>([]);
  const [events, setEvents] = useState<BillingEvent[]>([]);
  const [nameDraft, setName] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [openChart, setOpenChart] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const showReset = recovering || params.get('reset') === '1';

  useEffect(() => {
    void start();
  }, [start]);

  useEffect(() => {
    if (status !== 'signed-in') return;
    void refreshOverview();
    Promise.all([listPublishedCards(), listBillingEvents()])
      .then(([nextCards, nextEvents]) => {
        setCards(nextCards);
        setEvents(nextEvents);
      })
      .catch((error) => console.error(error));
  }, [status, refreshOverview]);

  if (!cloudEnabled) return <Navigate to="/settings" replace />;
  if (status === 'signed-out') return <Navigate to="/login?next=/account" replace />;
  if (status !== 'signed-in' || !user) return <main className="page"><p className="muted" role="status">Loading your account…</p></main>;

  const plan = overview?.plan ?? 'free';
  const limits = overview?.limits ?? PLANS.free.limits;
  const sub = overview?.subscription;
  const paid = plan !== 'free';
  const name = nameDraft ?? user.displayName;

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast(success);
    } catch (error) {
      toast(cloudErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveName(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await updateDisplayName(name);
    }, 'Profile updated');
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const supabase = await getSupabase();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      clearRecovering();
      params.delete('reset');
      setParams(params, { replace: true });
    }, 'Password updated');
  }

  async function toggleCard(card: PublishedCard) {
    await run(async () => {
      const row = await setCardActive(card.id, !card.isActive);
      setCards((current) => current.map((item) => (item.id === row.id ? row : item)));
      await refreshOverview();
    }, card.isActive ? 'Link switched off' : 'Card is live again');
  }

  async function removeCard(card: PublishedCard) {
    if (!window.confirm(`Delete the hosted card at /c/${card.slug}? The link and its view history will stop working permanently.`)) return;
    await run(async () => {
      await deletePublishedCard(card.id);
      setCards((current) => current.filter((item) => item.id !== card.id));
      await refreshOverview();
    }, 'Hosted card deleted');
  }

  async function cancelPlan(cancel: boolean) {
    if (cancel && !window.confirm(`Cancel ${PLANS[plan].name}? You keep it until ${sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'the end of the period'}.`)) return;
    await run(async () => {
      await setSubscriptionCancel(cancel);
      setEvents(await listBillingEvents());
    }, cancel ? 'Cancellation scheduled' : 'Subscription resumed');
  }

  async function removeAccount() {
    const typed = window.prompt('This permanently deletes your account, synced cards, hosted cards, and billing history. Cards saved in this browser are kept.\n\nType DELETE to confirm.');
    if (typed !== 'DELETE') return;
    await run(async () => {
      await deleteAccount();
      navigate('/', { replace: true });
    }, 'Your account was deleted');
  }

  return (
    <main className="page account-page">
      <header className="page-header account-header">
        <div>
          <h1>Your account</h1>
          <p>{user.email}</p>
        </div>
        <span className={`plan-badge plan-${plan}`}>{PLANS[plan].name}</span>
      </header>

      {showReset ? (
        <section className="setting-block highlight">
          <h2>Choose a new password</h2>
          <form className="inline-form" onSubmit={(event) => void savePassword(event)}>
            <label>New password<input type="password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label>
            <button type="submit" className="primary-button" disabled={busy}>Update password</button>
          </form>
        </section>
      ) : null}

      <div className="account-grid">
        <section className="setting-block">
          <h2><CreditCard size={18} /> Plan &amp; usage</h2>
          <p className="plan-line">
            <strong>{PLANS[plan].name}</strong> · {formatPrice(limits.price_cents)}{paid ? ' / month' : ''}
            {sub && paid ? (
              <span className="muted"> — {sub.cancelAtPeriodEnd ? 'ends' : 'renews'} {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : ''}{sub.provider === 'demo' ? ' (demo billing)' : ''}</span>
            ) : null}
          </p>
          <Meter label="Cards synced" used={overview?.usage.cloud_designs ?? 0} limit={limits.cloud_designs} />
          <Meter label="Live hosted cards" used={overview?.usage.live_cards ?? 0} limit={limits.live_cards} />
          <p className="muted"><Eye size={13} /> {(overview?.usage.total_views ?? 0).toLocaleString()} total card views</p>
          <div className="page-actions tight">
            <Link to="/pricing" className={paid ? 'ghost-button' : 'primary-button'}>{paid ? 'Change plan' : 'Upgrade'}</Link>
            {paid && sub && !sub.cancelAtPeriodEnd ? <button type="button" className="ghost-button danger" disabled={busy} onClick={() => void cancelPlan(true)}>Cancel plan</button> : null}
            {paid && sub?.cancelAtPeriodEnd ? <button type="button" className="ghost-button" disabled={busy} onClick={() => void cancelPlan(false)}>Resume plan</button> : null}
          </div>
        </section>

        <section className="setting-block">
          <h2><UserRound size={18} /> Profile</h2>
          <form className="inline-form" onSubmit={(event) => void saveName(event)}>
            <label>Display name<input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
            <button type="submit" className="ghost-button" disabled={busy}>Save</button>
          </form>
          <Link to="/account?reset=1" className="text-link">Change password</Link>
        </section>
      </div>

      <section className="setting-block">
        <h2><BarChart3 size={18} /> Hosted cards</h2>
        {cards.length === 0 ? (
          <p className="muted">No hosted cards yet. In the editor, open <strong>Privacy &amp; sharing</strong> and choose <strong>Publish card</strong>.</p>
        ) : (
          <ul className="hosted-list">
            {cards.map((card) => {
              const expired = isCardExpired(card);
              const live = isCardLive(card);
              return (
                <li key={card.id}>
                  <div className="hosted-row">
                    <div>
                      <a href={hostedCardUrl(card.slug)} target="_blank" rel="noreferrer" className="hosted-slug">/c/{card.slug} <ExternalLink size={13} /></a>
                      <span className="muted">{card.viewCount.toLocaleString()} views{card.lastViewedAt ? ` · last viewed ${new Date(card.lastViewedAt).toLocaleDateString()}` : ''}{expired ? ' · expired' : ''}</span>
                    </div>
                    <span className={live ? 'status-pill live' : 'status-pill'}>{live ? 'Live' : expired ? 'Expired' : 'Off'}</span>
                    <div className="hosted-actions">
                      <Link to={`/design/${encodeURIComponent(card.designId)}`} className="ghost-button">Edit</Link>
                      <button type="button" className="ghost-button" disabled={busy} onClick={() => setOpenChart(openChart === card.id ? null : card.id)}>Views</button>
                      <button type="button" className="ghost-button" disabled={busy} onClick={() => void toggleCard(card)}>{card.isActive ? 'Switch off' : 'Turn on'}</button>
                      <button type="button" className="icon-button danger" disabled={busy} onClick={() => void removeCard(card)} aria-label={`Delete /c/${card.slug}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {openChart === card.id ? (
                    limits.analytics ? <ViewsChart cardId={card.id} /> : <p className="upgrade-hint">Daily view analytics are included with <Link to="/pricing">Pro</Link>.</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="setting-block">
        <h2><Receipt size={18} /> Billing history</h2>
        {events.length === 0 ? (
          <p className="muted">No billing activity yet.</p>
        ) : (
          <table className="billing-table">
            <thead><tr><th scope="col">Date</th><th scope="col">Event</th><th scope="col">Amount</th></tr></thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{new Date(event.createdAt).toLocaleDateString()}</td>
                  <td>{billingLabel(event)}{event.provider === 'demo' ? <span className="tag">Demo</span> : null}</td>
                  <td>{event.amountCents ? formatPrice(event.amountCents) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="setting-block danger-zone">
        <h2>Session &amp; data</h2>
        <div className="page-actions tight">
          <button type="button" className="ghost-button" onClick={() => void signOut().then(() => navigate('/'))}><LogOut size={15} />Sign out</button>
          <button type="button" className="danger-button" disabled={busy} onClick={() => void removeAccount()}><Trash2 size={15} />Delete account</button>
        </div>
      </section>
    </main>
  );
}
