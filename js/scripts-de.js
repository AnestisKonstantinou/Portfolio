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
const entryId = '522odF81XhwFTDolnZG48m';

const locale = window.location.pathname.startsWith('/el/') ? 'el' : 'en-US';

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
      if (lightboxImage) lightboxImage.src = url;
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
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Create an <img> for each image in "images" array
    images.forEach((imgObj, index) => {
      const imgEl = document.createElement('img');
      imgEl.src = imgObj.url;
      imgEl.alt = imgObj.title || '';
       imgEl.loading = 'lazy';
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
if (document.querySelector('.article-title') && document.querySelector('.article')) {
  // Replace with your actual article entry ID
  const articleEntryId = '36dlJUaYhxaa2PQ7bCDS7a';

const locale = window.location.pathname.startsWith('/el/') ? 'el' : 'en-US';

fetch(`/.netlify/functions/contentful-article-proxy?entryId=${articleEntryId}&locale=${locale}`)
    .then(response => response.json())
    .then(data => {
      if (data.sys && data.fields) {
        const title = data.fields.title || "Untitled Article";
        const blogPost = data.fields.blogPost || "";
        const galleryImages = data.fields.gallery || [];

        // Update title and blog post text
        const titleEl = document.querySelector('.article-title');
        const blogPostEl = document.querySelector('.article');
        if (titleEl) titleEl.textContent = title;

        // Custom options for the Contentful rich text renderer so that hyperlinks open in a new tab
        const options = {
          renderNode: {
            'hyperlink': (node, next) => {
              const url = node.data.uri;
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`;
            }
          }
        };

        if (blogPostEl) blogPostEl.innerHTML = documentToHtmlString(blogPost, options);

        // If you want to show article images in a gallery
        const galleryContainer = document.querySelector('.article-gallery');
        if (galleryContainer && galleryImages.length > 0) {
          if (data.includes && data.includes.Asset) {
            galleryImages.forEach(imageRef => {
              const asset = data.includes.Asset.find(a => a.sys.id === imageRef.sys.id);
              if (asset && asset.fields && asset.fields.file) {
                const imgEl = document.createElement('img');
                imgEl.src = "https:" + asset.fields.file.url;
                imgEl.alt = asset.fields.title || "";
                galleryContainer.appendChild(imgEl);
              }
            });
          } else {
            console.warn("No data.includes.Asset found for article images.");
          }
        }
      } else {
        console.warn("Invalid article entry data:", data);
      }
    })
    .catch(err => console.error("Error fetching article:", err));
}
