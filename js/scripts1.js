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
const entryId = '522odF81XhwFTDolnZG48m'; // Your gallery entry ID
fetch(`/.netlify/functions/contentful-proxy?entryId=${entryId}`)
  .then(response => response.json())
  .then(data => {
    console.log('Contentful Gallery Data:', data);

    if (data.sys && data.sys.type === 'Entry' && data.fields) {
      const galleryEntry = data;
      const titleField = galleryEntry.fields.title || 'Untitled Gallery';
      const imagesArray = galleryEntry.fields.galleryItem || [];

      // Update any "galleryTitle" element if you wish
      const galleryTitleEl = document.getElementById('galleryTitle');
      if (galleryTitleEl) {
        galleryTitleEl.textContent = titleField;
      }

      // Grab your new grid container
      const gridContainer = document.getElementById('myGrid');
      if (!gridContainer) {
        console.warn("No element with id 'myGrid' found in the DOM!");
        return;
      }

      if (imagesArray.length === 0) {
        console.warn("Empty gallery array in fields.galleryItem");
      } else {
        // Build an array of image data for our lightbox
        const allImages = [];

        // Use the included assets to match each reference
        if (data.includes && data.includes.Asset) {
          imagesArray.forEach((imageRef, index) => {
            const asset = data.includes.Asset.find(a => a.sys.id === imageRef.sys.id);
            if (!asset || !asset.fields || !asset.fields.file) return;

            const imageUrl = 'https:' + asset.fields.file.url;
            const title = asset.fields.title || '';
            const description = asset.fields.description || '';

            allImages.push({ url: imageUrl, title, description });

            // Create <img> and append to the grid
            const imgEl = document.createElement('img');
            imgEl.src = imageUrl;
            imgEl.alt = title;
            imgEl.style.cursor = 'pointer';
            imgEl.addEventListener('click', () => {
              openLightbox(index); // open overlay at this image
            });
            gridContainer.appendChild(imgEl);
          });
        } else {
          console.warn("No data.includes.Asset found.");
        }

        // Now set up the lightbox overlay logic
        let currentIndex = 0;
        const overlay = document.getElementById('lightboxOverlay');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxDescription = document.getElementById('lightboxDescription');
        const closeBtn = document.getElementById('closeButton');
        const nextBtn = document.getElementById('nextButton');
        const prevBtn = document.getElementById('prevButton');

        function openLightbox(index) {
          currentIndex = index;
          if (!overlay) return;

          // Populate the overlay
          const { url, title, description } = allImages[currentIndex];
          if (lightboxImage) lightboxImage.src = url;
          if (lightboxTitle) lightboxTitle.textContent = title;
          if (lightboxDescription) lightboxDescription.textContent = description;

          // Show the overlay (assuming a "active" class triggers display)
          overlay.classList.add('active');
        }

        function closeLightbox() {
          if (overlay) {
            overlay.classList.remove('active');
          }
        }

        function showNext() {
          currentIndex = (currentIndex + 1) % allImages.length;
          openLightbox(currentIndex);
        }

        function showPrev() {
          currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
          openLightbox(currentIndex);
        }

        // Hook up buttons
        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        if (nextBtn) nextBtn.addEventListener('click', showNext);
        if (prevBtn) prevBtn.addEventListener('click', showPrev);

        // ESC key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            closeLightbox();
          }
        });
      }
    } else {
      console.warn('No valid entry found in the fetched data.');
    }
  })
  .catch(err => console.error('Error fetching gallery:', err));

/* ===========================
   3) (Optional) If you have an Article Page
   =========================== */
// Check if this page is an article page by looking for .article-title and .article
if (document.querySelector('.article-title') && document.querySelector('.article')) {
  // Replace with your actual article entry ID
  const articleEntryId = 'NI4BpqTDyJM05KsGh6SgF';

  fetch(`/.netlify/functions/contentful-proxy?entryId=${articleEntryId}`)
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
        if (blogPostEl) blogPostEl.innerHTML = documentToHtmlString(blogPost);

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
