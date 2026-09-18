import { Link } from 'react-router-dom';
import SignalDiagram from '../components/SignalDiagram';

const problems = [
  {
    title: 'Missed WhatsApp messages',
    body: 'Customers message after hours, during a haircut, or while you\'re with another client — and never hear back.',
  },
  {
    title: 'Repetitive questions',
    body: '"What time do you close?" "How much is a haircut?" "Where are you located?" — the same questions, over and over.',
  },
  {
    title: 'Lost bookings',
    body: 'By the time you reply, the customer has already booked somewhere else.',
  },
];

const steps = [
  {
    title: 'Tell AgentDesk about your business',
    body: 'Add your services, prices, opening hours and FAQs in a simple dashboard.',
  },
  {
    title: 'Your AI front desk goes live',
    body: 'Customers chat on WhatsApp or your website. AgentDesk answers questions and takes bookings — using only your real business information.',
  },
  {
    title: 'You stay in control',
    body: 'Every booking lands in your dashboard. Anything tricky gets handed straight to you.',
  },
];

const features = [
  {
    title: 'Answers FAQs instantly',
    body: 'Hours, prices, location — answered the moment a customer asks.',
    glyph: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V6Z" />,
  },
  {
    title: 'Captures bookings',
    body: 'Collects the details it needs and creates a real booking, every time.',
    glyph: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    title: 'Logs everything',
    body: 'Every conversation and booking is saved to your dashboard automatically.',
    glyph: <path d="M5 4h10l4 4v12H5V4Zm10 0v4h4M8 12h8M8 16h8" />,
  },
  {
    title: 'Knows when to hand over',
    body: 'Complaints, special requests, or anything outside its knowledge go straight to you.',
    glyph: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </>
    ),
  },
  {
    title: 'Built for WhatsApp',
    body: 'Where your Nigerian customers already are — with a website chat option too.',
    glyph: <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" />,
  },
  {
    title: 'A branded landing page',
    body: 'A clean digital front door for your business (Growth & Pro packages).',
    glyph: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16" />
      </>
    ),
  },
];

function Glyph({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default function Home() {
  return (
    <div className="surface-space">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(53,230,197,0.25), rgba(255,165,62,0.12) 55%, transparent 75%)' }}
        />
        <div className="container-page relative py-20 sm:py-28 grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-semibold tracking-tight text-paper leading-[1.08]">
              Never miss a customer again.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-paper/65">
              Your AI front desk answers customer questions, captures bookings and hands
              difficult conversations to you — even when you're busy.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
              <Link to="/demo" className="btn-secondary">
                Try the Demo
              </Link>
              <Link to="/contact" className="btn-ghost">
                Book a Demo
              </Link>
            </div>
            <p className="mt-5 text-xs text-paper/40 max-w-md">
              Answers only from your real business data — it won't invent prices, hours, or
              bookings.
            </p>
          </div>

          <div className="panel p-6 sm:p-8">
            <SignalDiagram />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="container-page py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-paper text-center">
          Every missed message is a missed customer
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="panel p-6">
              <h3 className="font-semibold text-paper">{p.title}</h3>
              <p className="mt-2 text-sm text-paper/55">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — a real sequence, so numbered + connected is earned here */}
      <section className="border-y border-ink-700 bg-ink-950/60">
        <div className="container-page py-16">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-paper text-center">
            How AgentDesk works
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-5 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-amber-500/60 via-signal-500/60 to-signal-500/60" />
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border font-display font-semibold text-sm ${
                    i === steps.length - 1
                      ? 'border-signal-500 text-signal-400 bg-ink-900'
                      : 'border-amber-500 text-amber-400 bg-ink-900'
                  }`}
                >
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold text-paper">{s.title}</h3>
                <p className="mt-2 text-sm text-paper/55">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold text-paper text-center">
          What your AI front desk does
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="panel-interactive p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-600 text-signal-400">
                <Glyph>{f.glyph}</Glyph>
              </div>
              <h3 className="mt-4 font-semibold text-paper">{f.title}</h3>
              <p className="mt-2 text-sm text-paper/55">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section className="container-page pb-24">
        <div className="panel p-8 sm:p-12 text-center overflow-hidden relative">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(53,230,197,0.12), transparent 60%)' }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-paper">
              See it answer like a real front desk
            </h2>
            <p className="mt-3 text-paper/60 max-w-xl mx-auto">
              Chat with a live demo agent for a fictional Nigerian barbershop, "Elite Cuts Minna" —
              ask about prices, hours, or try booking a haircut.
            </p>
            <Link to="/demo" className="btn-amber mt-7 inline-flex">
              Try the Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
