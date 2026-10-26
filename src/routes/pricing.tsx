import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus, Sparkles } from 'lucide-react';
import { cloudEnabled } from '../lib/cloud/client';
import { useSession } from '../lib/cloud/session';
import { formatPrice, PLAN_ORDER, PLANS, type PlanTier } from '../lib/plans';

const COMPARISON: { label: string; value: (tier: PlanTier) => string | boolean }[] = [
  { label: 'Designs saved on this device', value: () => 'Unlimited' },
  { label: 'PDF, PNG, SVG, vCard, QR, JSON exports', value: () => true },
  { label: 'Roster batch PDF', value: () => true },
  { label: 'Cards synced across devices', value: (tier) => String(PLANS[tier].limits.cloud_designs) },
  { label: 'Live hosted cards', value: (tier) => String(PLANS[tier].limits.live_cards) },
  { label: 'Switch a link off or update it any time', value: () => true },
  { label: 'Custom link (/c/your-name)', value: (tier) => PLANS[tier].limits.custom_slugs },
  { label: 'Daily view analytics', value: (tier) => PLANS[tier].limits.analytics },
  { label: 'No CardForge badge on digital cards', value: (tier) => PLANS[tier].limits.remove_badge }
];

const FAQ = [
  ['Do I need an account?', 'No. Designing, printing, exporting, and fragment share links all work without one. An account adds sync, hosted short links, and analytics.'],
  ['What happens if I downgrade?', 'Nothing is deleted. Cards over your new sync limit stay on your devices, and live cards keep working; you just can’t add more until you’re under the limit.'],
  ['What do analytics collect?', 'Only a count of views per card per day. No IP addresses, cookies, device fingerprints, or referrers are stored.'],
  ['Can I cancel any time?', 'Yes. Your plan stays active until the end of the billing period, then returns to Free.']
] as const;

export function PricingRoute() {
  const status = useSession((state) => state.status);
  const overview = useSession((state) => state.overview);
  const start = useSession((state) => state.start);
  const current = status === 'signed-in' ? overview?.plan ?? 'free' : null;

  useEffect(() => {
    void start();
  }, [start]);

  function cta(tier: PlanTier) {
    if (current === tier) return <span className="ghost-button full is-current">Your current plan</span>;
    if (tier === 'free') {
      return current ? null : <Link to="/new" className="ghost-button full">Start designing</Link>;
    }
    const checkout = `/checkout/${tier}`;
    const to = status === 'signed-in' ? checkout : `/login?mode=sign-up&next=${encodeURIComponent(checkout)}`;
    return <Link to={to} className={tier === 'pro' ? 'primary-button full' : 'ghost-button full'}>{current && current !== 'free' ? `Switch to ${PLANS[tier].name}` : `Get ${PLANS[tier].name}`}</Link>;
  }

  return (
    <main className="page pricing-page">
      <header className="page-header pricing-header">
        <h1>Simple plans for every introduction.</h1>
        <p>Design and print for free, forever. Upgrade when you want your cards to live online with short links, sync, and insight.</p>
        {!cloudEnabled ? <p className="notice-inline">This deployment runs in local-only mode, so paid cloud features aren’t available here.</p> : null}
      </header>

      <section className="plan-grid" aria-label="Plans">
        {PLAN_ORDER.map((tier) => {
          const plan = PLANS[tier];
          return (
            <article key={tier} className={tier === 'pro' ? 'plan-card featured' : 'plan-card'}>
              {tier === 'pro' ? <span className="plan-ribbon"><Sparkles size={13} /> Most popular</span> : null}
              <h2>{plan.name}</h2>
              <p className="plan-tagline">{plan.tagline}</p>
              <p className="plan-price"><strong>{formatPrice(plan.limits.price_cents)}</strong><span>{tier === 'free' ? 'forever' : '/ month'}</span></p>
              {cloudEnabled ? cta(tier) : null}
              <ul>
                {plan.highlights.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="compare" aria-labelledby="compare-heading">
        <h2 id="compare-heading">Compare plans</h2>
        <div className="compare-scroll">
          <table>
            <thead>
              <tr><th scope="col">Feature</th>{PLAN_ORDER.map((tier) => <th scope="col" key={tier}>{PLANS[tier].name}</th>)}</tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {PLAN_ORDER.map((tier) => {
                    const value = row.value(tier);
                    return (
                      <td key={tier}>
                        {value === true ? <Check size={16} aria-label="Included" /> : value === false ? <Minus size={16} aria-label="Not included" /> : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Questions</h2>
        <div className="faq-grid">
          {FAQ.map(([question, answer]) => (
            <article key={question}><h3>{question}</h3><p>{answer}</p></article>
          ))}
        </div>
      </section>
    </main>
  );
}
