import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getMarketingConsent, setMarketingConsent } from '../lib/metaPixel';

export default function MarketingConsent() {
  const [choice, setChoice] = useState(() => getMarketingConsent());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener('chronova:open-cookie-settings', openSettings);
    return () => window.removeEventListener('chronova:open-cookie-settings', openSettings);
  }, []);

  const choose = (value) => {
    setMarketingConsent(value);
    setChoice(value);
    setSettingsOpen(false);
  };
//Git merge
  if (choice !== null && !settingsOpen) return null;

  return createPortal(
    <aside className="marketing-consent" aria-label="Marketing cookie preferences">
      <div className="marketing-consent-copy">
        <strong>Your privacy choices</strong>
        <p>
          Essential storage keeps the storefront working. With your permission, Meta Pixel
          measures visits and shopping actions to help Chronova understand its advertising.
          Rejecting optional marketing tracking will not affect shopping. You can change this
          choice later in Cookie settings.
        </p>
        <Link to="/privacy" className="marketing-consent-policy">Read the privacy notice</Link>
      </div>
      <div className="marketing-consent-actions">
        <button type="button" className="consent-reject" onClick={() => choose('denied')}>Reject optional</button>
        <button type="button" className="consent-accept" onClick={() => choose('granted')}>Accept marketing</button>
      </div>
    </aside>,
    document.body,
  );
}