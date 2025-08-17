// /js/partials.js
// /js/partials.js
(function() {
  const defaultLang = "en";
  const m = location.pathname.match(/^\/(en|el)(?:\/|$)/);
  const currentLang = m ? m[1] : defaultLang;

  async function injectPartials() {
    const nodes = document.querySelectorAll("[data-include]");
    const cache = new Map();

    for (const el of nodes) {
      let url = el.getAttribute("data-include");
      // swap {lang} token
      url = url.replace("{lang}", currentLang);

      let html = cache.get(url);
      if (!html) {
        const res = await fetch(url, { credentials: "same-origin" });
        html = await res.text();
        cache.set(url, html);
      }
      el.outerHTML = html;
    }
    document.dispatchEvent(new CustomEvent("partials:ready", { detail: { lang: currentLang } }));
  }
  injectPartials();
})();

(async function injectPartials() {
  const nodes = document.querySelectorAll("[data-include]");
  const cache = new Map();

  for (const el of nodes) {
    const url = el.getAttribute("data-include");
    let html = cache.get(url);
    if (!html) {
      const res = await fetch(url, { credentials: "same-origin" });
      html = await res.text();
      cache.set(url, html);
    }
    el.outerHTML = html;
  }
  document.dispatchEvent(new CustomEvent("partials:ready"));
})();
