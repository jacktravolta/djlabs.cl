// Analytics consent gate for the Don Jack Labs corporate site.
//
// Google Tag Manager is loaded only after an explicit, stored authorization.
// The inline dataLayer bootstrap remains in index.html and does not send a
// network request on its own.

(() => {
  const GTM_ID = 'GTM-WZBZZHFV';
  const STORAGE_KEY = 'djlabs_analytics_consent';
  const GRANTED = 'granted';
  const DENIED = 'denied';
  const GTM_SRC = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;

  let banner = null;
  let details = null;
  let preferencesButton = null;
  let status = null;
  let decision = readDecision();
  let gtmWasLoaded = false;

  function readDecision() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === GRANTED || value === DENIED ? value : null;
    } catch (error) {
      // Private browsing modes can deny storage access. The current visit
      // remains usable and the visitor will be asked again next time.
      return null;
    }
  }

  function writeDecision(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // The decision still applies during this visit when storage is unavailable.
    }
  }

  function clearDecision() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // There is no persisted decision to remove when storage is unavailable.
    }
  }

  function loadGtm() {
    const existing = document.querySelector(`script[src="${GTM_SRC}"]`);
    if (existing) {
      gtmWasLoaded = true;
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = GTM_SRC;
    script.dataset.analyticsConsentManaged = 'true';
    document.head.appendChild(script);
    gtmWasLoaded = true;
  }

  function syncBodySpace() {
    if (!banner || !document.body) return;

    const height = Math.ceil(banner.getBoundingClientRect().height);
    document.body.style.setProperty('--analytics-consent-space', `${height + 32}px`);
  }

  function updatePreferenceButton() {
    if (!preferencesButton) return;

    if (decision === GRANTED) {
      preferencesButton.textContent = 'Analítica activada · Cambiar preferencia';
    } else if (decision === DENIED) {
      preferencesButton.textContent = 'Analítica desactivada · Cambiar preferencia';
    } else {
      preferencesButton.textContent = 'Cambiar preferencia de analítica';
    }
  }

  function setExpanded(expanded) {
    if (!banner || !details || !preferencesButton) return;

    details.hidden = !expanded;
    preferencesButton.hidden = expanded;
    preferencesButton.setAttribute('aria-expanded', String(expanded));
    syncBodySpace();
  }

  function showBanner(moveFocus = false) {
    if (!banner) {
      banner = createBanner();
      document.body.appendChild(banner);
    }

    banner.hidden = false;
    document.body.classList.add('analytics-consent-open');
    setExpanded(true);
    updatePreferenceButton();

    if (moveFocus) {
      window.requestAnimationFrame(() => {
        banner.querySelector('[data-analytics-consent="granted"]')?.focus();
      });
    }
  }

  function showSavedPreference() {
    if (!banner) {
      banner = createBanner();
      document.body.appendChild(banner);
    }

    banner.hidden = false;
    document.body.classList.add('analytics-consent-open');
    updatePreferenceButton();
    setExpanded(false);
  }

  function decide(value) {
    const previousDecision = decision;
    decision = value;
    writeDecision(value);

    if (value === GRANTED) {
      loadGtm();
    } else if (previousDecision === GRANTED) {
      // A clean reload guarantees that no analytics request continues after the
      // visitor revokes a previously granted preference.
      window.location.reload();
      return;
    }

    if (status) {
      status.textContent = value === GRANTED
        ? 'La analítica quedó activada.'
        : 'La analítica quedó desactivada.';
    }

    showSavedPreference();
  }

  function createBanner() {
    const aside = document.createElement('aside');
    aside.id = 'analytics-consent-banner';
    aside.className = 'analytics-consent-banner';
    aside.setAttribute('role', 'region');
    aside.setAttribute('aria-label', 'Preferencias de analítica del sitio');

    const content = document.createElement('div');
    content.className = 'analytics-consent-banner__content';

    const detailsElement = document.createElement('div');
    detailsElement.className = 'analytics-consent-banner__details';

    const copy = document.createElement('div');
    copy.className = 'analytics-consent-banner__copy';

    const title = document.createElement('h2');
    title.id = 'analytics-consent-title';
    title.className = 'analytics-consent-banner__title';
    title.textContent = 'Preferencias de analítica';

    const description = document.createElement('p');
    description.id = 'analytics-consent-description';
    description.className = 'analytics-consent-banner__description';
    description.textContent = 'Usamos Google Analytics para medir de forma agregada qué páginas y funciones se utilizan y así mejorar el sitio. No identificamos a las personas que lo visitan y puedes usar el sitio con normalidad sin autorizar la analítica. Puedes cambiar o revocar esta decisión en cualquier momento desde este aviso.';

    const statusElement = document.createElement('p');
    statusElement.className = 'analytics-consent-banner__status';
    statusElement.setAttribute('role', 'status');
    statusElement.setAttribute('aria-live', 'polite');

    copy.append(title, description);
    detailsElement.append(copy);

    const actions = document.createElement('div');
    actions.className = 'analytics-consent-banner__actions';

    const grantButton = document.createElement('button');
    grantButton.type = 'button';
    grantButton.className = 'analytics-consent-banner__button analytics-consent-banner__button--primary';
    grantButton.dataset.analyticsConsent = GRANTED;
    grantButton.textContent = 'Autorizar analítica';

    const denyButton = document.createElement('button');
    denyButton.type = 'button';
    denyButton.className = 'analytics-consent-banner__button analytics-consent-banner__button--secondary';
    denyButton.dataset.analyticsConsent = DENIED;
    denyButton.textContent = 'Continuar sin analítica';

    grantButton.addEventListener('click', () => decide(GRANTED));
    denyButton.addEventListener('click', () => decide(DENIED));

    actions.append(grantButton, denyButton);
    detailsElement.append(actions);

    const preferences = document.createElement('button');
    preferences.type = 'button';
    preferences.className = 'analytics-consent-banner__preferences';
    preferences.setAttribute('aria-expanded', 'false');
    preferences.addEventListener('click', () => showBanner(true));

    content.append(detailsElement, statusElement, preferences);
    aside.appendChild(content);

    details = detailsElement;
    preferencesButton = preferences;
    status = statusElement;

    return aside;
  }

  function init() {
    if (!document.body) return;

    if (decision === GRANTED) {
      loadGtm();
      showSavedPreference();
      return;
    }

    if (decision === DENIED) {
      showSavedPreference();
      return;
    }

    showBanner();
  }

  // Public reset API for reopening the consent choice from the site itself.
  window.__djlabsConsent = Object.freeze({
    reset() {
      const shouldReload = decision === GRANTED || gtmWasLoaded;
      clearDecision();
      decision = null;
      if (status) status.textContent = '';

      if (shouldReload) {
        window.location.reload();
        return;
      }

      showBanner(true);
    },
  });

  window.addEventListener('resize', syncBodySpace);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
