// scripts.js  (ES module, unified for galleries + articles)

/* =========================================
   0) Contentful image helpers / utilities
   ========================================= */
const THUMB_WIDTHS = [320, 480, 640, 960, 1280, 1600];

function isContentful(u) {
  try { return new URL(u).host.includes("images.ctfassets.net"); }
  catch { return false; }
}

function withParams(u, params) {
  const url = new URL(u, location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  return url.toString();
}

// Returns a good thumbnail URL + a full-size URL.
function lightboxUrls(originalUrl) {
  if (!originalUrl || !isContentful(originalUrl)) {
    return { preview: originalUrl, full: originalUrl };
  }

  // Simple heuristic: pick a 960px wide thumb by default
  const thumbWidth = 960;
  const preview = withParams(originalUrl, { w: thumbWidth, fm: "jpg", q: 65 });
  const full    = withParams(originalUrl, { fm: "jpg", q: 80 });
  return { preview, full };
}

// Lazy-load helper: schedule a batch of work
function scheduleBatch(fn) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(fn, { timeout: 200 });
  } else {
    setTimeout(fn, 16);
  }
}

/* =========================================
   1) Locale detection + path mapping
   ========================================= */
const SUPPORTED_LOCALES = ["en", "el"];

function detectLocale() {
  const segments = location.pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (SUPPORTED_LOCALES.includes(first)) return first;
  return "en"; // default
}
const LOCALE = detectLocale();

// Normalizes path for config maps
function normalizePath(pathname) {
  let path = pathname.split("?")[0].split("#")[0]; // remove query/hash
  // Optional: strip .html so /en/cv and /en/cv.html both work
  if (path.endsWith(".html")) path = path.slice(0, -5);
  // Remove trailing slash except root
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

// Homes: root "/" + "/en" + "/el"
const HOME_IDS = {};
function mapHome(enId, elId = enId) {
  HOME_IDS["/en"] = enId;
  HOME_IDS["/el"] = elId;
  HOME_IDS["/"]   = enId; // root defaults to EN
}

// Extra slideshow-style pages (e.g., Available Artworks)
const EXTRA_SLIDESHOW_IDS = {};
function mapSlideshow(slug, enId, elId = enId) {
  EXTRA_SLIDESHOW_IDS[`/en/${slug}`] = enId;
  EXTRA_SLIDESHOW_IDS[`/el/${slug}`] = elId;
}

// Central maps: path -> entryId
const GALLERY_IDS = {};
const ARTICLE_IDS = {};

// Register helper. If elId is omitted, it reuses enId (DRY).
function mapPair(map, slug, enId, elId = enId) {
  map[`/en/${slug}`] = enId;
  map[`/el/${slug}`] = elId;
}

/* ===========================
   REGISTER YOUR PAGES HERE
   =========================== */
// Home page
mapHome("1Y1HXZR5YdGX3W8xCa8o5C");

// Available Artworks page (slideshow)
const AVAILABLE_ID = "69XVOhTAfTUz4dTwHXZHOv";
HOME_IDS["/available.html"]      = AVAILABLE_ID;
HOME_IDS["/available"]           = AVAILABLE_ID;
HOME_IDS["/en/available.html"]   = AVAILABLE_ID;
HOME_IDS["/en/available"]        = AVAILABLE_ID;
HOME_IDS["/el/available.html"]   = AVAILABLE_ID;
HOME_IDS["/el/available"]        = AVAILABLE_ID;

// Galleries 
mapPair(GALLERY_IDS, "textile",    "522odF81XhwFTDolnZG48m");
mapPair(GALLERY_IDS, "textiles",   "522odF81XhwFTDolnZG48m"); // plural safety
mapPair(GALLERY_IDS, "sculptures", "6w706Y2fCkJSmABXsTPynu");
mapPair(GALLERY_IDS, "paintings",  "4oU2dtZPY9gX61G3Q7iGK0");

// Articles 
mapPair(ARTICLE_IDS, "larnaca",   "ZPjn3EbIvSO1SogWi029J"); 
mapPair(ARTICLE_IDS, "thedro",    "36dlJUaYhxaa2PQ7bCDS7a");
mapPair(ARTICLE_IDS, "eyes",      "3RKgj0xekKd08d09eeUtYL");
mapPair(ARTICLE_IDS, "cv",        "27N1K0F66rYGIIUcePHQq0"); // BIO page
mapPair(ARTICLE_IDS, "inner",     "7aq5i14B40stz4g74rbj5t");
mapPair(ARTICLE_IDS, "nemo",      "Yw0RI5SKuvuMNuSi51lrj");
mapPair(ARTICLE_IDS, "dowry",     "75poUixF1o7MHlOAwD5HDJ");
mapPair(ARTICLE_IDS, "interior",  "25AcvMDWLw0aiSTcc7L7um");
mapPair(ARTICLE_IDS, "sym",       "5BOc0b0A2WiiOj6JrBxj1J");
mapPair(ARTICLE_IDS, "biennale",  "NI4BpqTDyJM05KsGh6SgF");

/* =========================================
   2) Nav: hamburger + submenus (delegated)
   ========================================= */
function bindNavHandlers() {
  // Mobile hamburger
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  if (hamburgerBtn && mobileNav && !hamburgerBtn.__yBound) {
    hamburgerBtn.__yBound = true;
    hamburgerBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
    }, { passive: true });
  }

  // Desktop dropdowns — robust to minor DOM differences
  if (!document.__submenuDelegationBound) {
    document.__submenuDelegationBound = true;

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest?.("a.has-submenu");
      if (!trigger) return;

      e.preventDefault();

      const li = trigger.closest("li");
      if (!li) return;

      let submenu =
        li.querySelector(":scope > .submenu, :scope > ul.submenu, :scope > .sub-menu, :scope > ul.sub-menu")
        || li.querySelector(".submenu, ul.submenu, .sub-menu, ul.sub-menu");
      if (!submenu) return;

      // Close siblings at same level
      const parentUl = li.parentElement;
      if (parentUl) {
        parentUl.querySelectorAll(":scope > li > .submenu.open, :scope > li > .sub-menu.open")
          .forEach((openEl) => { if (openEl !== submenu) openEl.classList.remove("open"); });
      }

      submenu.classList.toggle("open");
    }, { passive: false });
  }
}

/* =========================================
   3) Gallery pages (grid of images)
   ========================================= */
(function initGallery() {
  const pathKey = normalizePath(location.pathname);
  const entryId = GALLERY_IDS[pathKey];
  if (!entryId) return; // not a configured gallery page

  // IDs updated to match your HTML
  const gridContainer   = document.getElementById("myGrid");
  const lightbox        = document.getElementById("lightboxOverlay");
  const lightboxImg     = document.getElementById("lightboxImage");
  const lightboxTitle   = document.getElementById("lightboxTitle");
  const lightboxDesc    = document.getElementById("lightboxDescription");
  const lightboxCloseBtn= document.getElementById("closeButton");
  const lightboxPrevBtn = document.getElementById("prevButton");
  const lightboxNextBtn = document.getElementById("nextButton");

  if (!gridContainer || !lightbox || !lightboxImg) {
    console.warn("Gallery container or lightbox elements missing.");
    return;
  }

  let images = [];
  let currentIndex = -1;

  function openLightbox(index) {
    if (index < 0 || index >= images.length) return;
    currentIndex = index;
    const item = images[index];
    const { full } = lightboxUrls(item.url);

    lightboxImg.src = full;
    lightboxImg.alt = item.title || "";
    if (lightboxTitle) lightboxTitle.textContent = item.title || "";
    if (lightboxDesc)  lightboxDesc.textContent  = item.description || "";

    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.classList.remove("open");
    currentIndex = -1;
  }

  function showNext(delta) {
    if (currentIndex < 0) return;
    const newIndex = (currentIndex + delta + images.length) % images.length;
    openLightbox(newIndex);
  }

  // Close on background click
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  // Controls
  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener("click", () => closeLightbox(), { passive: true });
  if (lightboxPrevBtn)  lightboxPrevBtn.addEventListener("click", () => showNext(-1), { passive: true });
  if (lightboxNextBtn)  lightboxNextBtn.addEventListener("click", () => showNext(1),  { passive: true });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape")     closeLightbox();
    if (e.key === "ArrowRight") showNext(1);
    if (e.key === "ArrowLeft")  showNext(-1);
  });

  const locale = LOCALE;

  fetch(`/.netlify/functions/contentful-proxy?entryId=${entryId}&locale=${locale}`)
    .then(r => r.json())
    .then(data => {
      images = Array.isArray(data?.images) ? data.images : [];
      if (!images.length) return;

      gridContainer.innerHTML = "";

      const BATCH_SIZE = 24;
      function renderBatch(startIndex) {
        const end = Math.min(startIndex + BATCH_SIZE, images.length);
        for (let i = startIndex; i < end; i++) {
          const item = images[i];
          const { preview } = lightboxUrls(item.url);

          const imgEl = document.createElement("img");
          imgEl.loading = "lazy";
          imgEl.src = preview;
          imgEl.alt = item.title || "";
          imgEl.className = "gallery-item";

          imgEl.addEventListener("click", () => openLightbox(i), { passive: true });

          const wrapper = document.createElement("div");
          wrapper.className = "gallery-item-wrapper";
          wrapper.appendChild(imgEl);

          if (item.title) {
            const captionTitle = document.createElement("p");
            captionTitle.className = "gallery-item-title";
            captionTitle.textContent = item.title;
            wrapper.appendChild(captionTitle);
          }

          if (item.description) {
            const captionDesc = document.createElement("p");
            captionDesc.className = "gallery-item-desc";
            captionDesc.textContent = item.description;
            wrapper.appendChild(captionDesc);
          }

          gridContainer.appendChild(wrapper);
        }
        if (end < images.length) scheduleBatch(() => renderBatch(end));
      }

      renderBatch(0);
    })
    .catch(err => console.error("Error fetching gallery:", err));
})();

/* =========================================
   4) Article pages (dynamic import + optimized images)
   (Bio page uses .article-title, .article, .article-gallery)
   ========================================= */
(async function initArticle() {
  const pathKey = normalizePath(location.pathname);
  const entryId = ARTICLE_IDS[pathKey];
  if (!entryId) return; // not an article page

  const locale = LOCALE;

  // Match your BIO HTML
  const articleTitleEl   = document.querySelector(".article-title");
  const articleBodyEl    = document.querySelector(".article");
  const articleGalleryEl = document.querySelector(".article-gallery"); // also has .cv-gallery

  if (!articleTitleEl || !articleBodyEl) {
    console.warn("Article container elements missing.");
    return;
  }

  try {
    const res = await fetch(`/.netlify/functions/contentful-article?entryId=${entryId}&locale=${locale}`);
    const data = await res.json();

    const {
      title,
      bodyHtml,
      date,        // may be unused on BIO
      heroImage,   // optional
      images: articleImages = [],
    } = data || {};

    articleTitleEl.textContent = title || "";
    articleBodyEl.innerHTML    = bodyHtml || "";

    // Optional hero image support (if you add one later)
    if (heroImage?.url) {
      const hero = document.createElement("img");
      const { preview, full } = lightboxUrls(heroImage.url);
      hero.loading = "lazy";
      hero.src = preview;
      hero.alt = heroImage.title || title || "";
      hero.className = "article-hero-img";
      articleBodyEl.prepend(hero);

      const hi = new Image();
      hi.onload = () => { if (hero.src === preview) hero.src = full; };
      hi.src = full;
    }

    // Optional gallery (works for CV too)
    if (articleGalleryEl && articleImages.length) {
      articleGalleryEl.innerHTML = "";

      const BATCH_SIZE = 24;
      function renderBatch(start) {
        const end = Math.min(start + BATCH_SIZE, articleImages.length);
        for (let i = start; i < end; i++) {
          const item = articleImages[i];
          const { preview, full } = lightboxUrls(item.url);

          const img = document.createElement("img");
          img.loading = "lazy";
          img.src  = preview;
          img.alt  = item.title || "";
          img.className = "article-gallery-item";

          // Reuse site lightbox if present
          img.addEventListener("click", () => {
            const lb     = document.getElementById("lightboxOverlay");
            const lbImg  = document.getElementById("lightboxImage");
            const lbTit  = document.getElementById("lightboxTitle");
            const lbDesc = document.getElementById("lightboxDescription");
            if (!lb || !lbImg) return;

            lbImg.src = full;
            lbImg.alt = item.title || "";
            if (lbTit)  lbTit.textContent  = item.title || "";
            if (lbDesc) lbDesc.textContent = item.description || "";
            lb.setAttribute("aria-hidden", "false");
            lb.classList.add("open");
          }, { passive: true });

          articleGalleryEl.appendChild(img);
        }
        if (end < articleImages.length) scheduleBatch(() => renderBatch(end));
      }

      renderBatch(0);
    }
  } catch (err) {
    console.error("Error fetching article:", err);
  }
})();

/* =========================================
   5) Bind nav on DOM ready, and REBIND after partials load/refresh
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  bindNavHandlers();
});

// Important: re-bind when your partials finish injecting/updating
document.addEventListener("partials:ready",   bindNavHandlers);
document.addEventListener("partials:updated", bindNavHandlers);
