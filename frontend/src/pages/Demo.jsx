import ChatWidget from '../components/ChatWidget';

const DEMO_BUSINESS_ID = import.meta.env.VITE_DEMO_BUSINESS_ID;

export default function Demo() {
  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-paper">Try AgentDesk live</h1>
          <p className="mt-4 text-paper/60">
            This is a real conversation with the AI front desk for "Elite Cuts Minna", a fictional
            Nigerian barbershop. Ask about opening hours, prices, or try booking a haircut for
            Saturday.
          </p>
        </div>

        <div className="mt-10 max-w-md mx-auto">
          {DEMO_BUSINESS_ID ? (
            <ChatWidget
              businessId={DEMO_BUSINESS_ID}
              greeting="Hi, welcome to Elite Cuts Minna! How can I help you today?"
            />
          ) : (
            <div className="panel p-6 text-sm text-paper/60">
              <p className="font-medium text-paper">Demo not configured yet</p>
              <p className="mt-2">
                Set <code className="bg-ink-700 px-1 rounded text-signal-400">VITE_DEMO_BUSINESS_ID</code> in{' '}
                <code className="bg-ink-700 px-1 rounded text-signal-400">frontend/.env</code> to the id of the seeded
                "Elite Cuts Minna" business (see <code className="bg-ink-700 px-1 rounded text-signal-400">database/seed/seed_demo_business.sql</code>)
                to enable this live demo.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 max-w-2xl mx-auto grid sm:grid-cols-3 gap-4 text-sm text-paper/60">
          <div className="panel p-4">
            <p className="font-medium text-paper">Try asking</p>
            <p className="mt-1">"What time do you close?"</p>
          </div>
          <div className="panel p-4">
            <p className="font-medium text-paper">Try asking</p>
            <p className="mt-1">"How much is a haircut?"</p>
          </div>
          <div className="panel p-4">
            <p className="font-medium text-paper">Try booking</p>
            <p className="mt-1">"I want to book a haircut for Saturday at 10am"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
