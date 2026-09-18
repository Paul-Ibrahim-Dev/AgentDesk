export default function Logo({ className = '', dark = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display font-semibold ${dark ? 'text-paper' : 'text-ink-900'} ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <circle cx="13" cy="13" r="12" stroke="currentColor" strokeOpacity="0.25" />
        <circle cx="13" cy="13" r="3" fill="#35E6C5" />
        <circle cx="4.5" cy="13" r="1.6" fill="#FFA53E" />
        <circle cx="21.5" cy="13" r="1.6" fill="#35E6C5" />
        <path d="M6.5 13H10.5" stroke="#FFA53E" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M15.5 13H19.5" stroke="#35E6C5" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className="text-lg tracking-tight">AgentDesk</span>
    </span>
  );
}
