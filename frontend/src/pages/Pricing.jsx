import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    setup: '₦150,000',
    period: 'one-time setup',
    features: ['WhatsApp AI agent', 'FAQs', 'Booking capture'],
  },
  {
    name: 'Growth',
    setup: '₦250,000',
    period: 'one-time setup',
    features: ['Everything in Starter', 'Branded landing page'],
    highlighted: true,
  },
  {
    name: 'Pro',
    setup: '₦150,000 + ₦50,000/mo',
    period: 'setup + monthly',
    features: ['Everything in Growth', 'Booking dashboard', 'Monthly tweaks & support'],
  },
];

export default function Pricing() {
  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-paper">Simple, fixed pricing</h1>
          <p className="mt-4 text-paper/60">
            No surprises. Pick the package that fits your business — you can always upgrade later.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`panel p-8 flex flex-col ${plan.highlighted ? 'border-signal-500' : ''}`}
              style={plan.highlighted ? { boxShadow: '0 0 0 1px rgba(53,230,197,0.4), 0 20px 40px -20px rgba(53,230,197,0.35)' } : undefined}
            >
              {plan.highlighted && (
                <span className="badge bg-signal-500/15 text-signal-400 self-start mb-3">Most popular</span>
              )}
              <h2 className="text-xl font-display font-semibold text-paper">{plan.name}</h2>
              <p className="mt-2 text-2xl font-display font-semibold text-paper">{plan.setup}</p>
              <p className="text-sm text-paper/45">{plan.period}</p>

              <ul className="mt-6 space-y-3 text-sm text-paper/70 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-signal-400 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to="/contact" className={plan.highlighted ? 'btn-primary mt-8' : 'btn-secondary mt-8'}>
                Contact us to get started
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-paper/45">
          Payments are arranged directly with our team — reach out via the{' '}
          <Link to="/contact" className="text-signal-400 underline">
            contact page
          </Link>{' '}
          and we'll confirm details before setup begins.
        </p>
      </div>
    </div>
  );
}
