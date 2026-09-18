import { useState } from 'react';

const faqs = [
  {
    q: 'Will the AI make up information about my business?',
    a: 'No. AgentDesk only answers using the services, prices, hours and FAQs you configure. If it doesn\'t know something, it says so and offers to connect the customer with you, instead of guessing.',
  },
  {
    q: 'What happens if a customer asks something the AI can\'t answer?',
    a: 'The conversation is marked as needing a human and handed to you, with the reason recorded (e.g. complaint, special request, or outside its knowledge). You can then reply directly from your dashboard.',
  },
  {
    q: 'Does it work on WhatsApp?',
    a: 'Yes — AgentDesk is built around WhatsApp, where most Nigerian customers already are. A website chat widget is also available.',
  },
  {
    q: 'Can I see and manage bookings?',
    a: 'Yes. Every booking the AI creates appears in your dashboard, where you can confirm, cancel, or mark it complete.',
  },
  {
    q: 'Can I try it before signing up?',
    a: 'Yes — visit the Demo page to chat with a live example agent for a fictional barbershop and see how it answers questions and takes a booking.',
  },
  {
    q: 'How is my business data kept separate from other businesses?',
    a: 'AgentDesk is built as a multi-tenant system — every business\'s data is isolated at the database level, so one business can never see another\'s customers, bookings, or conversations.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel p-5">
      <button
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-medium text-paper">{q}</span>
        <span className="text-signal-400 text-xl leading-none">{open ? '–' : '+'}</span>
      </button>
      {open && <p className="mt-3 text-sm text-paper/60">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-paper">Frequently asked questions</h1>
        </div>

        <div className="mt-10 max-w-2xl mx-auto space-y-4">
          {faqs.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
}
