/**
 * The one orchestrated motion on the marketing site: a message travels
 * from a customer to AgentDesk, then forks into the two real outcomes the
 * product promises — an instant answer, or a captured booking. Everything
 * else on the page stays still so this keeps its weight.
 */
export default function SignalDiagram() {
  return (
    <div className="relative">
      <svg
        viewBox="0 0 440 240"
        className="w-full h-auto"
        role="img"
        aria-label="A customer message travels to AgentDesk, then becomes either an instant answer or a confirmed booking"
      >
        <defs>
          <radialGradient id="nodeGlowAmber" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFA53E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFA53E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nodeGlowSignal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#35E6C5" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#35E6C5" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Routing lines */}
        <path
          id="pathAnswer"
          d="M56,120 L196,120 C258,120 300,80 388,58"
          fill="none"
          stroke="#35E6C5"
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />
        <path
          id="pathBooking"
          d="M56,120 L196,120 C258,120 300,160 388,182"
          fill="none"
          stroke="#FFA53E"
          strokeOpacity="0.3"
          strokeWidth="1.5"
        />

        {/* Node glows */}
        <circle cx="56" cy="120" r="26" fill="url(#nodeGlowAmber)" />
        <circle cx="196" cy="120" r="30" fill="url(#nodeGlowSignal)" />
        <circle cx="388" cy="58" r="22" fill="url(#nodeGlowSignal)" />
        <circle cx="388" cy="182" r="22" fill="url(#nodeGlowAmber)" />

        {/* Nodes */}
        <circle cx="56" cy="120" r="6" fill="#FFA53E" />
        <circle cx="196" cy="120" r="8" fill="#0A0E27" stroke="#35E6C5" strokeWidth="2" />
        <circle cx="196" cy="120" r="2.5" fill="#35E6C5" />
        <circle cx="388" cy="58" r="5.5" fill="#35E6C5" />
        <circle cx="388" cy="182" r="5.5" fill="#FFA53E" />

        {/* Travelling signal dots */}
        <circle r="3.2" fill="#6FF0DA">
          <animateMotion dur="3.2s" repeatCount="indefinite" begin="0s">
            <mpath href="#pathAnswer" />
          </animateMotion>
        </circle>
        <circle r="3.2" fill="#FFBB6B">
          <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.6s">
            <mpath href="#pathBooking" />
          </animateMotion>
        </circle>

        {/* Labels */}
        <text x="56" y="146" textAnchor="middle" fontSize="11" fill="#93A0C7" style={{ fontFamily: 'Inter, sans-serif' }}>
          Customer
        </text>
        <text x="196" y="102" textAnchor="middle" fontSize="11" fill="#F6F7FB" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          AgentDesk
        </text>
        <text x="388" y="40" textAnchor="middle" fontSize="11" fill="#93A0C7" style={{ fontFamily: 'Inter, sans-serif' }}>
          Answered
        </text>
        <text x="388" y="204" textAnchor="middle" fontSize="11" fill="#93A0C7" style={{ fontFamily: 'Inter, sans-serif' }}>
          Booked
        </text>
      </svg>

      <div className="mt-2 space-y-2.5 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-md border border-ink-600 bg-ink-900/60 px-3.5 py-2.5">
          <span className="text-paper/70">"What time do you close?"</span>
          <span className="text-signal-400 text-xs font-medium whitespace-nowrap">Answered from FAQs</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-ink-600 bg-ink-900/60 px-3.5 py-2.5">
          <span className="text-paper/70">"Book a haircut for Saturday"</span>
          <span className="text-amber-400 text-xs font-medium whitespace-nowrap">Booking captured</span>
        </div>
      </div>
    </div>
  );
}
