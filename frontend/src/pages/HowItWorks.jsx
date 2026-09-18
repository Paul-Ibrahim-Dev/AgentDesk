import { Link } from 'react-router-dom';

const flow = [
  {
    title: '1. You set up your digital front desk',
    body:
      'Add your business details, services and prices, opening hours, and frequently asked questions. Configure your AI agent\'s name, greeting and tone, then preview it before it goes live.',
  },
  {
    title: '2. Customers chat on WhatsApp or your website',
    body:
      'A customer messages your business number or website chat widget with a question, or to book. AgentDesk reads their message and responds using only the information you\'ve given it.',
  },
  {
    title: '3. The AI answers, or asks what it needs',
    body:
      'FAQs, prices and services are answered instantly. For a booking, it collects the customer\'s name, phone number, date and time before creating anything — it never guesses.',
  },
  {
    title: '4. A booking is created — for real',
    body:
      'Once it has everything it needs, AgentDesk creates the booking in your dashboard. It only tells the customer "you\'re booked" after that booking has actually been saved.',
  },
  {
    title: '5. Anything tricky comes to you',
    body:
      'Complaints, special requests, or questions outside what you\'ve configured are handed straight to you, with a clear reason recorded — you reply directly from the dashboard.',
  },
];

export default function HowItWorks() {
  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-paper">How AgentDesk works</h1>
          <p className="mt-4 text-paper/60">
            AgentDesk is a digital front desk for your business. The technology underneath is AI —
            but what you get is faster responses, captured bookings, and fewer missed customers.
          </p>
        </div>

        <div className="mt-12 space-y-10 max-w-3xl">
          {flow.map((step) => (
            <div key={step.title} className="border-l-2 border-signal-500/40 pl-6">
              <h2 className="text-lg font-semibold text-paper">{step.title}</h2>
              <p className="mt-2 text-paper/60">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 panel p-6 max-w-3xl">
          <h3 className="font-semibold text-paper">What AgentDesk will never do</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-paper/60 list-disc pl-5">
            <li>Invent prices, opening hours, services, or your address</li>
            <li>Claim a booking succeeded when it didn't</li>
            <li>Make promises about discounts or refunds on your behalf</li>
            <li>Share one business's data with another</li>
          </ul>
        </div>

        <div className="mt-12 flex gap-3">
          <Link to="/demo" className="btn-primary">Try the Demo</Link>
          <Link to="/pricing" className="btn-secondary">See Pricing</Link>
        </div>
      </div>
    </div>
  );
}
