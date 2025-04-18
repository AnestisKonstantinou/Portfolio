// --- Google Consent Mode v2 ---
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

gtag('consent', 'default', {
  'ad_storage': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});

// --- Check if Consent Was Already Given ---
const consentStatus = localStorage.getItem('cookieConsent');
if (consentStatus === 'accepted') {
  gtag('consent', 'update', {
    'ad_storage': 'granted',
    'analytics_storage': 'granted'
  });
} else if (consentStatus === 'declined') {
  gtag('consent', 'update', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied'
  });
} else {
  // --- Language Detection ---
  const lang = window.location.pathname.startsWith('/el/') ? 'el' : 'en';

  const messages = {
    el: {
      message: "Αυτός ο ιστότοπος χρησιμοποιεί cookies για ανάλυση επισκεψιμότητας.",
      accept: "Αποδοχή",
      decline: "Απόρριψη",
      moreInfo: "Μάθετε περισσότερα"
    },
    en: {
      message: "This website uses cookies for traffic analysis.",
      accept: "Accept",
      decline: "Decline",
      moreInfo: "Learn more"
    }
  };

  const t = messages[lang];

  // --- Create Banner ---
  const consentBanner = document.createElement('div');
  consentBanner.id = 'cookie-consent-banner';
  consentBanner.innerHTML = `
    <div class="consent-text">${t.message}</div>
    <div class="consent-buttons">
      <a href="/privacy.html" target="_blank" class="more-info">${t.moreInfo}</a>
      <button id="declineCookies">${t.decline}</button>
      <button id="acceptCookies">${t.accept}</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #cookie-consent-banner {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      max-width: 500px;
      margin: auto;
      background: #222;
      color: #fff;
      font-family: 'Helvetica Neue', sans-serif;
      font-size: 0.9rem;
      padding: 1rem;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      z-index: 10000;
    }

    .consent-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    #cookie-consent-banner button,
    #cookie-consent-banner .more-info {
      font-family: inherit;
      font-weight: bold;
      font-size: 0.85rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 5px;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    #cookie-consent-banner button:hover,
    #cookie-consent-banner .more-info:hover {
      background-color: #ddd;
      color: #000;
    }

    #cookie-consent-banner #acceptCookies {
      background-color: #ffffff;
      color: #222;
    }

    #cookie-consent-banner #declineCookies {
      background-color: #aaa;
      color: #fff;
    }

    #cookie-consent-banner .more-info {
      background-color: transparent;
      color: #ffffff;
      border: 1px solid #fff;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(consentBanner);

  // --- Button Logic ---
  document.getElementById('acceptCookies').addEventListener('click', () => {
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'analytics_storage': 'granted'
    });
    localStorage.setItem('cookieConsent', 'accepted');
    consentBanner.remove();
  });

  document.getElementById('declineCookies').addEventListener('click', () => {
    gtag('consent', 'update', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied'
    });
    localStorage.setItem('cookieConsent', 'declined');
    consentBanner.remove();
  });
}
