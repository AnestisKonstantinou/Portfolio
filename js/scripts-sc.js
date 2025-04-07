// scripts.js
import { documentToHtmlString } from "https://cdn.skypack.dev/@contentful/rich-text-html-renderer";

/* ===========================
   1) Submenu & Mobile Navigation Toggle
   =========================== */
const submenuLinks = document.querySelectorAll(".has-submenu");
submenuLinks.forEach(link => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const submenu = link.nextElementSibling;
    document.querySelectorAll(".submenu").forEach(otherSubmenu => {
      if (otherSubmenu !== submenu) {
        otherSubmenu.classList.remove("open-submenu");
      }
    });
    submenu.classList.toggle("open-submenu");
    console.log("Submenu Toggled:", submenu);
  });
});

const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileNav = document.getElementById("mobileNav");
if (hamburgerBtn && mobileNav) {
  hamburgerBtn.addEventListener("click", () => {
    console.log("Hamburger Clicked 🍔");
    mobileNav.classList.toggle("open");
  });
} else {
  console.warn("Hamburger menu or mobile nav not found.");
}

/* ===========================
   2) Fetch Gallery from Contentful & Build Grid
   =========================== */
const entryId = '6w706Y2fCkJSmABXsTPynu';

const locale = window.location.pathname.startsWith('/el/') ? 'el' : 'en-US';

/**
 * Optimize the image URL using Contentful's Image API.
 * @param {string} url - The original image URL.
 * @param {number} width - Desired width in pixels.
 * @param {number} height - Desired height in pixels.
 * @returns {string} - The optimized image URL.
 */
function optimizeImageUrl(url, width, height) {
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + `w=${width}&h=${height}&fit=fill`;
}

fetch(`/.netlify/functions/contentful-proxy?entryId=${entryId}&locale=${locale}`)
  .then(response => response.json())
  .then(data => {
    console.log('Resolved Gallery Data:', data);

    // data should look like { title: "...", images: [...] }
    const { title, images } = data;
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.warn("No images returned from function.");
      return;
    }

    // Optional: show the gallery title in the page
    const galleryTitleEl = document.getElementById('galleryTitle');
    if (galleryTitleEl) {
      galleryTitleEl.textContent = title;
    }

    // 2.1) Build the grid of images
    const gridContainer = document.getElementById('myGrid');
    if (!gridContainer) {
      console.warn("No #myGrid container found.");
      return;
    }
    gridContainer.innerHTML = '';

    let currentIndex = 0;
    const overlay = document.getElementById('lightboxOverlay');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDescription = document.getElementById('lightboxDescription');
    const closeBtn = document.getElementById('closeButton');
    const nextBtn = document.getElementById('nextButton');
    const prevBtn = document.getElementById('prevButton');

    // Lightbox functions
    function openLightbox(index) {
      currentIndex = index;
      const { url, title, description } = images[currentIndex];
      if (lightboxImage) lightboxImage.src = url; // Use full resolution here
      if (lightboxTitle) lightboxTitle.textContent = title;
      if (lightboxDescription) lightboxDescription.textContent = description;
      if (overlay) overlay.classList.add('active');
    }
    function closeLightbox() {
      if (overlay) overlay.classList.remove('active');
    }
    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      openLightbox(currentIndex);
    }
    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      openLightbox(currentIndex);
    }
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (nextBtn) nextBtn.addEventListener('click', showNext);
    if (prevBtn) prevBtn.addEventListener('click', showPrev);

    // Keyboard navigation for lightbox: arrow keys for next/prev, Escape to close
    document.addEventListener('keydown', (e) => {
      if (overlay && overlay.classList.contains('active')) {
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'ArrowRight') {
          showNext();
        } else if (e.key === 'ArrowLeft') {
          showPrev();
        }
      }
    });

    // Create an <img> for each image in the "images" array
    images.forEach((imgObj, index) => {
      const imgEl = document.createElement('img');
      // Use the optimized URL for the grid view
      const optimizedUrl = optimizeImageUrl(imgObj.url, 400, 300);
      imgEl.src = optimizedUrl;
      imgEl.alt = imgObj.title || '';
      imgEl.loading = 'lazy';  // Enable native lazy loading
      imgEl.style.cursor = 'pointer';
      imgEl.addEventListener('click', () => {
        openLightbox(index);
      });
      gridContainer.appendChild(imgEl);
    });
  })
  .catch(err => console.error('Error fetching final gallery data:', err));
/* ===========================
   3) (Optional) If you have an Article Page
   =========================== */
// Check if this page is an article page by looking for .article-title and .article
