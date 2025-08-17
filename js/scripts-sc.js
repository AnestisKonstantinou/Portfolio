// scripts.js  (ES module)
import { documentToHtmlString } from "https://cdn.skypack.dev/@contentful/rich-text-html-renderer";

/* ===========================
   0) Image helpers (Contentful transforms)
   =========================== */
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

// Thumbnails for the grid (small, modern)
function thumbUrl(u, w) {
  return isContentful(u) ? withParams(u, { w, q: 70, fm: "webp" }) : u;
}

// Lightbox: return a fast preview AND the true original
function lightboxUrls(u) {
  if (!isContentful(u)) return { preview: u, full: u };
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const previewW = Math.ceil(Math.min(2400, window.innerWidth * dpr)); // sharp preview
  return {
    preview: withParams(u, { w: previewW, q: 80, fm: "webp" }),
    full: u // original (no params)
  };
}

/* ===========================
   1) Nav: hamburger + submenus (delegated)
   =========================== */
function bindNavHandlers() {
  // Mobile hamburger
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

  // Delegated submenu toggle (works for both side + mobile nav)
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

    // Keyboard (Enter/Space)
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

/* ===========================
   2) Gallery: fetch + responsive thumbs + batching + HQ lightbox
   =========================== */
(function initGallery() {
  // If the page doesn’t have a grid container, skip
  const gridContainer =
    document.getElementById("myGrid") ||
    document.querySelector(".gallery") ||
    document.querySelector(".article-gallery");

  if (!gridContainer) return;

  const entryId = "6w706Y2fCkJSmABXsTPynu"; // textiles
  const locale = window.location.pathname.startsWith("/el/") ? "el" : "en-US";

  // Safe scheduler for follow-up batches
  const scheduleBatch = ("requestIdleCallback" in window)
    ? (cb) => window.requestIdleCallback(cb)
    : (cb) => setTimeout(cb, 0);

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

      gridContainer.innerHTML = "";

      // Lightbox elements
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
          lightboxImage.src = preview; // fast preview

          // Preload original & swap when ready (if still viewing same item)
          const hi = new Image();
          hi.onload = () => {
            if (images[currentIndex]?.url === url) {
              lightboxImage.src = full; // upgrade to perfect quality
            }
          };
          hi.src = full;
        }

        if (lightboxTitle) lightboxTitle.textContent = title || "";
        if (lightboxDescription) lightboxDescription.textContent = description || "";
        if (overlay) overlay.classList.add("active");
      }
      function closeLightbox() { if (overlay) overlay.classList.remove("active"); }
      function showNext() { currentIndex = (currentIndex + 1) % images.length; openLightbox(currentIndex); }
      function showPrev() { currentIndex = (currentIndex - 1 + images.length) % images.length; openLightbox(currentIndex); }

      if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
      if (nextBtn) nextBtn.addEventListener("click", showNext);
      if (prevBtn) prevBtn.addEventListener("click", showPrev);

      document.addEventListener("keydown", (e) => {
        if (overlay && overlay.classList.contains("active")) {
          if (e.key === "Escape") { closeLightbox(); e.preventDefault(); }
          else if (e.key === "ArrowRight") { showNext(); e.preventDefault(); }
          else if (e.key === "ArrowLeft") { showPrev(); e.preventDefault(); }
        }
      });

      // Build the grid in batches
      const BATCH = 12; // adjust if you want

      function renderBatch(start = 0) {
        const end = Math.min(start + BATCH, images.length);

        for (let i = start; i < end; i++) {
          const imgObj = images[i];
          const imgEl = document.createElement("img");

          // a11y / UX
          imgEl.alt = (imgObj.title || "").trim();
          imgEl.style.cursor = "pointer";
          imgEl.loading = i < 2 ? "eager" : "lazy"; // prioritize first couple
          imgEl.fetchPriority = i < 2 ? "high" : "low";
          imgEl.decoding = "async";

          // Your layout: ~3 columns desktop (≈30vw), fewer on mobile
          imgEl.sizes = "(max-width: 480px) 100vw, (max-width: 768px) 50vw, 30vw";

          // Responsive thumbnails via Contentful
          imgEl.src = thumbUrl(imgObj.url, 640);
          imgEl.srcset = THUMB_WIDTHS.map(w => `${thumbUrl(imgObj.url, w)} ${w}w`).join(", ");

          // Avoid layout jank while images stream in
          imgEl.style.contentVisibility = "auto";
          imgEl.style.containIntrinsicSize = "400px 300px";

          imgEl.addEventListener("click", () => openLightbox(i));
          gridContainer.appendChild(imgEl);
        }

        if (end < images.length) {
          scheduleBatch(() => renderBatch(end));
        }
      }

      renderBatch(0);
    })
    .catch(err => console.error("Error fetching final gallery data:", err));
})();

/* ===========================
   3) (Optional) Article page (rich text + gallery)
   =========================== */
(function initArticle() {
  const isArticle = document.querySelector(".article-title") && document.querySelector(".article");
  if (!isArticle) return;

  const articleEntryId = "NI4BpqTDyJM05KsGh6SgF";
  const locale = window.location.pathname.startsWith("/el/") ? "el" : "en-US";

  fetch(`/.netlify/functions/contentful-article-proxy?entryId=${articleEntryId}&locale=${locale}`)
    .then(r => r.json())
    .then(data => {
      if (!(data && data.sys && data.fields)) {
        console.warn("Invalid article entry data:", data);
        return;
      }

      const title = data.fields.title || "Untitled Article";
      const blogPost = data.fields.blogPost || "";
      const galleryImages = data.fields.gallery || [];

      const titleEl = document.querySelector(".article-title");
      const blogPostEl = document.querySelector(".article");
      if (titleEl) titleEl.textContent = title;

      // Open links in new tab
      const options = {
        renderNode: {
          hyperlink: (node, next) => {
            const url = node.data?.uri || "#";
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`;
          }
        }
      };
      if (blogPostEl) blogPostEl.innerHTML = documentToHtmlString(blogPost, options);

      // Optional article gallery (raw assets)
      const galleryContainer = document.querySelector(".article-gallery");
      if (galleryContainer && galleryImages.length > 0 && data.includes?.Asset) {
        galleryImages.forEach(imageRef => {
          const asset = data.includes.Asset.find(a => a.sys.id === imageRef.sys.id);
          if (asset?.fields?.file?.url) {
            const imgEl = document.createElement("img");
            imgEl.src = "https:" + asset.fields.file.url;
            imgEl.alt = asset.fields.title || "";
            galleryContainer.appendChild(imgEl);
          }
        });
      }
    })
    .catch(err => console.error("Error fetching article:", err));
})();
