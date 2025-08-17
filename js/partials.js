// /js/partials.js
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
