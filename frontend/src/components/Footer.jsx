import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-ink-700 bg-ink-950 mt-24">
      <div className="container-page py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-paper/50 max-w-xs">
            AI front-desk agents for Nigerian SMEs. Never miss a customer again.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-paper mb-3">Product</h4>
          <ul className="space-y-2.5 text-sm text-paper/50">
            <li><Link to="/how-it-works" className="hover:text-signal-400">How It Works</Link></li>
            <li><Link to="/pricing" className="hover:text-signal-400">Pricing</Link></li>
            <li><Link to="/demo" className="hover:text-signal-400">Try the Demo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-paper mb-3">Company</h4>
          <ul className="space-y-2.5 text-sm text-paper/50">
            <li><Link to="/faq" className="hover:text-signal-400">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-signal-400">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-paper mb-3">Get started</h4>
          <ul className="space-y-2.5 text-sm text-paper/50">
            <li><Link to="/register" className="hover:text-signal-400">Create an account</Link></li>
            <li><Link to="/login" className="hover:text-signal-400">Log in</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800 py-4 text-center text-xs text-paper/30">
        © {new Date().getFullYear()} AgentDesk. Built for Nigerian SMEs.
      </div>
    </footer>
  );
}
