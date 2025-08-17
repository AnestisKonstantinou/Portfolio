// /js/partials.js
(() => {
  const VERSION = "v1"; // ⬅️ bump this whenever you change any partials
  const DEFAULT_LANG = "en";

  // Detect language from leading path segment: /en/... or /el/...
  const match = location.pathname.match(/^\/(en|el)(?:\/|$)/);
  const currentLang = match ? match[1] : DEFAULT_LANG;

  const resolveUrl = (raw) => raw.replace("{lang}", currentLang);
  const storageKey = (url) => `navPartial:${VERSION}:${currentLang}:${url}`;

  // Add a traceable attribute to the root tag of the partial HTML
  const tagWithMarker = (html, url) => {
    const trimmed = String(html).trim();
    // Insert data-injected-from="url" into the first opening tag
    return trimmed.replace(
      /^(<\s*[^>\s]+)([^>]*>)/,
      (_, start, rest) => `${start} data-injected-from="${url}"${rest}`
    );
  };

  const injectOuterHTML = (el, html) => {
    el.outerHTML = html;
  };

  const fetchText = async (url) => {
    const res = await fetch(url, { credentials: "same-origin", cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
    return await res.text();
  };

  async function injectPartials() {
    const placeholders = Array.from(document.querySelectorAll("[data-include]"));
    if (placeholders.length === 0) return;

    // Map placeholders -> resolved URLs
    const entries = placeholders.map((el) => {
      const raw = el.getAttribute("data-include");
      const url = resolveUrl(raw);
      return { el, raw, url };
    });

    let injectedFromCache = false;

    // 1) Instant paint from localStorage cache (if available)
    for (const { el, url } of entries) {
      const key = storageKey(url);
      const cached = localStorage.getItem(key);
      if (cached) {
        injectOuterHTML(el, cached);
        injectedFromCache = true;
      }
    }

    if (injectedFromCache) {
      document.body.classList.add("nav-ready");
      document.dispatchEvent(
        new CustomEvent("partials:ready", { detail: { lang: currentLang, source: "cache" } })
      );
    }

    // 2) Fetch fresh in parallel, update DOM & cache if changed
    let updatedAny = false;
    await Promise.all(
      entries.map(async ({ el, url }) => {
        const key = storageKey(url);
        try {
          const freshRaw = await fetchText(url);
          const fresh = tagWithMarker(freshRaw, url);
          const cached = localStorage.getItem(key);

          if (cached !== fresh) {
            // Determine where to inject:
            //  - if placeholder still exists (no cache path), use it
            //  - else, find the node we previously injected by marker
            const target =
              el.isConnected ? el : document.querySelector(`[data-injected-from="${url}"]`);
            if (target) {
              injectOuterHTML(target, fresh);
              updatedAny = true;
            }
            localStorage.setItem(key, fresh);
          } else if (!cached) {
            // No cache previously; inject now into the placeholder
            if (el && el.isConnected) {
              injectOuterHTML(el, fresh);
            } else {
              // Fallback: if placeholder was already replaced somehow, replace by marker
              const t = document.querySelector(`[data-injected-from="${url}"]`);
              if (t) injectOuterHTML(t, fresh);
            }
            localStorage.setItem(key, fresh);
          }
        } catch (err) {
          console.warn(err);
        }
      })
    );

    // 3) Announce readiness/updates
    if (!document.body.classList.contains("nav-ready")) {
      document.body.classList.add("nav-ready");
      document.dispatchEvent(
        new CustomEvent("partials:ready", { detail: { lang: currentLang, source: "network" } })
      );
    } else if (updatedAny) {
      document.dispatchEvent(
        new CustomEvent("partials:updated", { detail: { lang: currentLang } })
      );
    }
  }

  // Run ASAP
  injectPartials();
})();
