import { useState } from 'react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // MVP: no backend contact endpoint yet — this simply confirms receipt
    // in the UI. Swap for a real submit-to-email/CRM call when ready.
    setSubmitted(true);
  }

  return (
    <div className="surface-space min-h-[calc(100vh-4rem)]">
      <div className="container-page py-16">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-paper">Get in touch</h1>
          <p className="mt-4 text-paper/60">
            Tell us a bit about your business and we'll reach out to set up your AgentDesk package.
          </p>

          {submitted ? (
            <div className="mt-8 panel p-6 border-signal-500/40">
              <p className="font-medium text-signal-400">Thanks — we've got your message.</p>
              <p className="mt-1 text-sm text-paper/60">
                Our team will reach out shortly to discuss your AgentDesk setup.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="label-dark" htmlFor="contact-business">Business name</label>
                <input id="contact-business" className="input-dark" required placeholder="e.g. Elite Cuts Minna" />
              </div>
              <div>
                <label className="label-dark" htmlFor="contact-name">Your name</label>
                <input id="contact-name" className="input-dark" required placeholder="Your full name" />
              </div>
              <div>
                <label className="label-dark" htmlFor="contact-phone">Phone or WhatsApp number</label>
                <input id="contact-phone" className="input-dark" required placeholder="+234..." />
              </div>
              <div>
                <label className="label-dark" htmlFor="contact-package">Which package are you interested in?</label>
                <select id="contact-package" className="input-dark" defaultValue="Starter">
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Pro</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div>
                <label className="label-dark" htmlFor="contact-notes">Anything else we should know?</label>
                <textarea id="contact-notes" className="input-dark" rows={4} placeholder="Optional" />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
