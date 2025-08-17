// /js/partials.js
(() => {
  const defaultLang = "en";
  const m = location.pathname.match(/^\/(en|el)(?:\/|$)/);
  const currentLang = m ? m[1] : defaultLang;
  const VERSION = "v1"; // bump when you edit any partials

  async function fetchText(url) {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-cache" });
    return await res.text();
  }

  function cacheKey(url) {
    return `navPartial:${VERSION}:${currentLang}:${url}`;
  }

  function injectHTML(el, html) {
    el.outerHTML = html;
  }

  async function injectPartials() {
    const nodes = Array.from(document.querySelectorAll("[data-include]"));
    const cache = new Map();

    // 1) Try to inject from cache immediately (no layout shift)
    nodes.forEach(el => {
      let url = el.getAttribute("data-include").replace("{lang}", currentLang);
      const key = cacheKey(url);
      const cached = localStorage.getItem(key);
      if (cached) {
        injectHTML(el, cached);
        cache.set(url, cached);
      }
    });

    // 2) Fetch fresh content and update DOM + cache if changed
    await Promise.all(nodes.map(async el => {
      let url = el.getAttribute("data-include").replace("{lang}", currentLang);
      const key = cacheKey(url);
      const fresh = await fetchText(url);
      const existing = cache.get(url);
      if (fresh && fresh !== existing) {
        // Replace the *current* placeholder/inserted node
        const placeholder = document.querySelector(`[data-include="${el.getAttribute("data-include")}"]`) || null;
        if (placeholder) {
          injectHTML(placeholder, fresh);
        } else {
          // If we already replaced it earlier, replace the most similar node by id/class if you want,
          // or skip to avoid flicker. Usually not needed if step (1) didn't inject.
        }
        localStorage.setItem(key, fresh);
      } else if (!existing && fresh) {
        // No cache existed (first visit): inject now
        injectHTML(el, fresh);
        localStorage.setItem(key, fresh);
      }
    }));

    document.dispatchEvent(new CustomEvent("partials:ready", { detail: { lang: currentLang } }));
  }

  // Run ASAP
  injectPartials();
})();
