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

// Grid thumbnails (small, modern)
function thumbUrl(u, w) {
  return isContentful(u) ? withParams(u, { w, q: 70, fm: "webp" }) : u;
}

// Lightbox: fast preview → then swap to original
function lightboxUrls(u) {
  if (!isContentful(u)) return { preview: u, full: u };
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const previewW = Math.ceil(Math.min(2400, window.innerWidth * dpr)); // sharp preview
  return {
    preview: withParams(u, { w: previewW, q: 80, fm: "webp" }),
    full: u // original (no params)
  };
}

// Keep UI responsive when adding many nodes
const scheduleBatch = ("requestIdleCallback" in window)
  ? (cb) => window.requestIdleCallback(cb)
  : (cb) => setTimeout(cb, 0);

// Normalize path to map keys (no .html, no trailing slash)
function normalizePath(p) {
  return p
    .replace(/\/index\.html$/i, "")
    .replace(/\.html$/i, "")
    .replace(/\/$/, "");
}

// Locale detection for your URL scheme
const LOCALE = location.pathname.startsWith("/el/") ? "el" : "en-US";

/* =========================================
   1) Page → Entry ID maps (fill these)
   ========================================= */

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

// Galleries 
mapPair(GALLERY_IDS, "textile", "522odF81XhwFTDolnZG48m");
mapPair(GALLERY_IDS, "index", "1Y1HXZR5YdGX3W8xCa8o5C");
mapPair(GALLERY_IDS, "sculptures", "6w706Y2fCkJSmABXsTPynu");
mapPair(GALLERY_IDS, "paintings", "4oU2dtZPY9gX61G3Q7iGK0");


// Articles 
mapPair(ARTICLE_IDS, "larnaca", "ZPjn3EbIvSO1SogWi029J"); 
mapPair(ARTICLE_IDS, "thedro", "36dlJUaYhxaa2PQ7bCDS7a");
mapPair(ARTICLE_IDS, "eyes", "3RKgj0xekKd08d09eeUtYL");
mapPair(ARTICLE_IDS, "cv", "27N1K0F66rYGIIUcePHQq0");
mapPair(ARTICLE_IDS, "inner", "7aq5i14B40stz4g74rbj5t");
mapPair(ARTICLE_IDS, "nemo", "Yw0RI5SKuvuMNuSi51lrj");
mapPair(ARTICLE_IDS, "dowry", "75poUixF1o7MHlOAwD5HDJ");
mapPair(ARTICLE_IDS, "interior", "25AcvMDWLw0aiSTcc7L7um");
mapPair(ARTICLE_IDS, "sym", "5BOc0b0A2WiiOj6JrBxj1J");
mapPair(ARTICLE_IDS, "biennale", "NI4BpqTDyJM05KsGh6SgF");

/* =========================================
   2) Nav: hamburger + submenus (delegated)
   ========================================= */
function bindNavHandlers() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
    }, { passive: true });
  }

  // ARIA prep for submenu triggers
  document.querySelectorAll("a.has-submenu").forEach(a => {
    if (!a.hasAttribute("role")) a.setAttribute("role", "button");
    if (!a.hasAttribute("aria-expanded")) a.setAttribute("aria-expanded", "false");
  });

  // Delegated toggle (works for desktop + mobile nav)
  if (!document.__submenuDelegationBound) {
    document.__submenuDelegationBound = true;

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest?.("a.has-submenu");
      if (!trigger) return;
      e.preventDefault();

      const submenu = trigger.nextElementSibling;
      if (!submenu || !submenu.classList.contains("submenu")) return;

      // Close siblings
      const parentUl = trigger.closest("ul");
      if (parentUl) {
        parentUl.querySelectorAll(":scope > li > .submenu.open-submenu").forEach(other => {
          if (other !== submenu) other.classList.remove("open-submenu");
        });
      }

      const isOpen = submenu.classList.toggle("open-submenu");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });

    // Keyboard support
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const trigger = e.target.closest?.("a.has-submenu");
      if (!trigger) return;
      e.preventDefault();

      const submenu = trigger.nextElementSibling;
      if (!submenu || !submenu.classList.contains("submenu")) return;

      const isOpen = submenu.classList.toggle("open-submenu");
      trigger.setAttribute("aria-expanded", String(isOpen));
    });
  }
}
document.addEventListener("DOMContentLoaded", bindNavHandlers);

/* =========================================
   3) Gallery pages
   ========================================= */
(function initGallery() {
  const pathKey = normalizePath(location.pathname);
  const entryId = GALLERY_IDS[pathKey];
  if (!entryId) return; // not a gallery page

  const gridContainer =
    document.getElementById("myGrid") ||
    document.querySelector(".gallery") ||
    document.querySelector(".gallery-grid") ||
    document.querySelector(".article-gallery");
  if (!gridContainer) return;

  const locale = LOCALE;

  fetch(`/.netlify/functions/contentful-proxy?entryId=${entryId}&locale=${locale}`)
    .then(r => r.json())
    .then(data => {
      const { title, images } = data || {};
      if (!Array.isArray(images) || images.length === 0) {
        console.warn("No images returned from function.");
        return;
      }

      const galleryTitleEl = document.getElementById("galleryTitle");
      if (galleryTitleEl) galleryTitleEl.textContent = title || "";

      // Lightbox elements (shared overlay)
      let currentIndex = 0;
      const overlay = document.getElementById("lightboxOverlay");
      const lightboxImage = document.getElementById("lightboxImage");
      const lightboxTitle = document.getElementById("lightboxTitle");
      const lightboxDescription = document.getElementById("lightboxDescription");
      const closeBtn = document.getElementById("closeButton");
      const nextBtn = document.getElementById("nextButton");
      const prevBtn = document.getElementById("prevButton");

      function openLightbox(index) {
        currentIndex = index;
        const { url, title, description } = images[currentIndex];
        const { preview, full } = lightboxUrls(url);

        if (lightboxImage) {
          lightboxImage.src = preview;
          const hi = new Image();
          hi.onload = () => {
            if (images[currentIndex]?.url === url) lightboxImage.src = full;
          };
          hi.src = full;
        }
        if (lightboxTitle)       lightboxTitle.textContent = title || "";
        if (lightboxDescription) lightboxDescription.textContent = description || "";
        overlay?.classList.add("active");
      }
      function closeLightbox() { overlay?.classList.remove("active"); }
      function showNext() { currentIndex = (currentIndex + 1) % images.length; openLightbox(currentIndex); }
      function showPrev() { currentIndex = (currentIndex - 1 + images.length) % images.length; openLightbox(currentIndex); }

      closeBtn?.addEventListener("click", closeLightbox);
      nextBtn?.addEventListener("click", showNext);
      prevBtn?.addEventListener("click", showPrev);
      document.addEventListener("keydown", (e) => {
        if (overlay && overlay.classList.contains("active")) {
          if (e.key === "Escape") { closeLightbox(); e.preventDefault(); }
          else if (e.key === "ArrowRight") { showNext(); e.preventDefault(); }
          else if (e.key === "ArrowLeft") { showPrev(); e.preventDefault(); }
        }
      });

      // Build thumbnails in batches
      gridContainer.innerHTML = "";
      const BATCH = 12;

      function renderBatch(start = 0) {
        const end = Math.min(start + BATCH, images.length);
        for (let i = start; i < end; i++) {
          const imgObj = images[i];
          const imgEl = document.createElement("img");

          imgEl.alt = (imgObj.title || "").trim();
          imgEl.style.cursor = overlay && lightboxImage ? "pointer" : "default";
          imgEl.loading = i < 2 ? "eager" : "lazy";
          imgEl.fetchPriority = i < 2 ? "high" : "low";
          imgEl.decoding = "async";
          imgEl.sizes = "(max-width: 480px) 100vw, (max-width: 768px) 50vw, 30vw";

          imgEl.src = thumbUrl(imgObj.url, 640);
          imgEl.srcset = THUMB_WIDTHS.map(w => `${thumbUrl(imgObj.url, w)} ${w}w`).join(", ");

          imgEl.style.contentVisibility = "auto";
          imgEl.style.containIntrinsicSize = "400px 300px";

          if (overlay && lightboxImage) {
            imgEl.addEventListener("click", () => openLightbox(i));
          }

          gridContainer.appendChild(imgEl);
        }
        if (end < images.length) scheduleBatch(() => renderBatch(end));
      }

      renderBatch(0);
    })
    .catch(err => console.error("Error fetching gallery:", err));
})();

/* =========================================
   4) Article pages (dynamic import + optimized images)
   ========================================= */
(async function initArticle() {
  const pathKey = normalizePath(location.pathname);
  const entryId = ARTICLE_IDS[pathKey];
  if (!entryId) return; // not an article page

  const titleEl = document.querySelector(".article-title");
  const bodyEl  = document.querySelector(".article");
  if (!titleEl || !bodyEl) return;

  const locale = LOCALE;

  // Load Contentful rich-text renderer only on article pages
  const { documentToHtmlString } = await import(
    "https://cdn.skypack.dev/@contentful/rich-text-html-renderer@17"
  );

  try {
    const res  = await fetch(`/.netlify/functions/contentful-article-proxy?entryId=${entryId}&locale=${locale}`);
    const data = await res.json();
    if (!(data && data.sys && data.fields)) {
      console.warn("Invalid article entry data:", data);
      return;
    }

    // Render text
    const options = {
      renderNode: {
        hyperlink: (node, next) => {
          const url = node.data?.uri || "#";
          return `<a href="${url}" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`;
        }
      }
    };
    titleEl.textContent = data.fields.title || "";
    bodyEl.innerHTML    = documentToHtmlString(data.fields.blogPost || "", options);

    // Build article gallery if present
    const galleryContainer = document.querySelector(".article-gallery");
    const refs   = data.fields.gallery || [];
    const assets = data.includes?.Asset || [];

    if (galleryContainer && refs.length) {
      galleryContainer.innerHTML = "";

      const articleImages = [];
      refs.forEach(ref => {
        const asset = assets.find(a => a.sys.id === ref.sys.id);
        if (!asset?.fields?.file?.url) return;
        const raw = "https:" + asset.fields.file.url;
        articleImages.push({
          url: raw,
          title: asset.fields.title || "",
          description: asset.fields.description || ""
        });
      });

      // Reuse global lightbox overlay
      const overlay            = document.getElementById("lightboxOverlay");
      const lightboxImage      = document.getElementById("lightboxImage");
      const lightboxTitle      = document.getElementById("lightboxTitle");
      const lightboxDescription= document.getElementById("lightboxDescription");
      const closeBtn           = document.getElementById("closeButton");
      const nextBtn            = document.getElementById("nextButton");
      const prevBtn            = document.getElementById("prevButton");

      let currentIdx = 0;
      function openArticleLightbox(i) {
        currentIdx = i;
        const { url, title, description } = articleImages[currentIdx];
        const { preview, full } = lightboxUrls(url);

        if (lightboxImage) {
          lightboxImage.src = preview;
          const hi = new Image();
          hi.onload = () => {
            if (articleImages[currentIdx]?.url === url) lightboxImage.src = full;
          };
          hi.src = full;
        }
        if (lightboxTitle)       lightboxTitle.textContent = title;
        if (lightboxDescription) lightboxDescription.textContent = description;
        overlay?.classList.add("active");
      }
      function closeLightbox() { overlay?.classList.remove("active"); }
      function showNext() { currentIdx = (currentIdx + 1) % articleImages.length; openArticleLightbox(currentIdx); }
      function showPrev() { currentIdx = (currentIdx - 1 + articleImages.length) % articleImages.length; openArticleLightbox(currentIdx); }

      closeBtn?.addEventListener("click", closeLightbox);
      nextBtn?.addEventListener("click", showNext);
      prevBtn?.addEventListener("click", showPrev);
      document.addEventListener("keydown", (e) => {
        if (overlay && overlay.classList.contains("active")) {
          if (e.key === "Escape") { closeLightbox(); e.preventDefault(); }
          else if (e.key === "ArrowRight") { showNext(); e.preventDefault(); }
          else if (e.key === "ArrowLeft") { showPrev(); e.preventDefault(); }
        }
      });

      const BATCH = 10;
      function renderBatch(start = 0) {
        const end = Math.min(start + BATCH, articleImages.length);
        for (let i = start; i < end; i++) {
          const imgObj = articleImages[i];
          const img = document.createElement("img");

          img.alt = (imgObj.title || "").trim();
          img.loading = i < 2 ? "eager" : "lazy";
          img.fetchPriority = i < 2 ? "high" : "low";
          img.decoding = "async";
          img.sizes = "(max-width: 768px) 100vw, 40vw";
          img.src = thumbUrl(imgObj.url, 640);
          img.srcset = THUMB_WIDTHS.map(w => `${thumbUrl(imgObj.url, w)} ${w}w`).join(", ");

          img.style.contentVisibility = "auto";
          img.style.containIntrinsicSize = "400px 300px";

          if (overlay && lightboxImage) {
            img.style.cursor = "pointer";
            img.addEventListener("click", () => openArticleLightbox(i));
          }

          galleryContainer.appendChild(img);
        }
        if (end < articleImages.length) scheduleBatch(() => renderBatch(end));
      }

      renderBatch(0);
    }
  } catch (err) {
    console.error("Error fetching article:", err);
  }
})();
