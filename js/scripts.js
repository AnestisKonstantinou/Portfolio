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

  const entryId = "522odF81XhwFTDolnZG48m"; // textiles
  const locale = window.location.pathname.startsWith("/el/") ? "el" : "en-US";

  // Safe scheduler for follow-up batches
  const scheduleBatch = ("requestIdleCallback" in window)
    ? (cb) => window.requestIdleCallback(cb)
    : (cb) => setTimeout(cb, 0);

  fetch(`/.netlify/functions/contentful-proxy?entryId=${entryId}&locale=${locale}`)
    .
