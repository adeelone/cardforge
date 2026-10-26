import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, Info, Lock } from 'lucide-react';
import { cloudEnabled } from '../lib/cloud/client';
import { useSession } from '../lib/cloud/session';
import { demoCheckout } from '../lib/cloud/api';
import { cloudErrorMessage, formatPrice, isPlanTier, PLANS } from '../lib/plans';
import { toast } from '../lib/toast';

export function CheckoutRoute() {
  const { plan: planParam } = useParams();
  const status = useSession((state) => state.status);
  const overview = useSession((state) => state.overview);
  const start = useSession((state) => state.start);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void start();
  }, [start]);

  if (!cloudEnabled || !isPlanTier(planParam) || planParam === 'free') return <Navigate to="/pricing" replace />;
  if (status === 'signed-out') return <Navigate to={`/login?mode=sign-up&next=${encodeURIComponent(`/checkout/${planParam}`)}`} replace />;
  if (status !== 'signed-in') return <main className="page"><p className="muted" role="status">Loading checkout…</p></main>;

  const tier = planParam;
  const plan = PLANS[tier];
  const renews = new Date();
  renews.setMonth(renews.getMonth() + 1);
  const alreadyOn = overview?.plan === tier && !overview.subscription?.cancelAtPeriodEnd;

  async function confirm() {
    setBusy(true);
    try {
      await demoCheckout(tier);
      setDone(true);
      toast(`You’re on ${plan.name}`);
    } catch (error) {
      toast(cloudErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="page checkout-page">
        <section className="checkout-success">
          <CheckCircle2 size={40} />
          <h1>Welcome to {plan.name}.</h1>
          <p>Your new limits are active right now. A receipt is in your billing history.</p>
          <div className="page-actions">
            <Link to="/new" className="primary-button">Open the editor</Link>
            <Link to="/account" className="ghost-button">View account</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page checkout-page">
      <Link to="/pricing" className="text-link back-link"><ArrowLeft size={15} />Back to plans</Link>
      <div className="checkout-grid">
        <section className="checkout-summary">
          <h1>Upgrade to {plan.name}</h1>
          <p className="muted">{plan.tagline}</p>
          <ul>
            {plan.highlights.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}
          </ul>
        </section>

        <section className="checkout-pay" aria-label="Order summary">
          <div className="order-line"><span>{plan.name} — monthly</span><strong>{formatPrice(plan.limits.price_cents)}</strong></div>
          <div className="order-line muted"><span>Renews</span><span>{renews.toLocaleDateString()}</span></div>
          <div className="order-line total"><span>Due today</span><strong>{overview?.demoBilling === false ? formatPrice(plan.limits.price_cents) : '$0.00'}</strong></div>

          {overview?.demoBilling !== false ? (
            <p className="demo-notice"><Info size={16} /> <span><strong>Demo checkout.</strong> No payment details are collected and nothing is charged. Confirming activates the plan on your account so you can try every feature.</span></p>
          ) : null}

          <button type="button" className="primary-button large full" disabled={busy || alreadyOn} onClick={() => void confirm()}>
            <Lock size={16} />{alreadyOn ? `You’re already on ${plan.name}` : busy ? 'Activating…' : `Start ${plan.name}`}
          </button>
          <p className="muted">Cancel any time from your account. Your plan stays active until the end of the period.</p>
        </section>
      </div>
    </main>
  );
}
