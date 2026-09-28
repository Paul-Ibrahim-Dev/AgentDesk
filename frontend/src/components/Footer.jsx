import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-24">
      <div className="container-page py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-gray-600 max-w-xs">
            AI front-desk agents for Nigerian SMEs. Never miss a customer again.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900 mb-3">Product</h4>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><Link to="/how-it-works" className="hover:text-brand-600">How It Works</Link></li>
            <li><Link to="/pricing" className="hover:text-brand-600">Pricing</Link></li>
            <li><Link to="/demo" className="hover:text-brand-600">Try the Demo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900 mb-3">Company</h4>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><Link to="/faq" className="hover:text-brand-600">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-brand-600">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-ink-900 mb-3">Get started</h4>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><Link to="/register" className="hover:text-brand-600">Create an account</Link></li>
            <li><Link to="/login" className="hover:text-brand-600">Log in</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} AgentDesk. Built for Nigerian SMEs.
      </div>
    </footer>
  );
}
