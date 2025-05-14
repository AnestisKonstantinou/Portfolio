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
// Global variable for gallery items and current index
// Global variables for gallery items and current slide index.
let galleryItems = [];
let currentSlideIndex = 0;

// Function to update the slideshow with the specified slide index.
function showSlide(index) {
  if (galleryItems.length === 0) return;
  // Ensure the index is in range (cyclic behavior).
  currentSlideIndex = (index + galleryItems.length) % galleryItems.length;
  const slideImage = document.getElementById('slide-image');
  const slideTitle = document.getElementById('slide-title');
  const item = galleryItems[currentSlideIndex];
  // Set optimized image for default
slideImage.src = item.url;

// Set responsive sizes
slideImage.srcset = `
  ${item.url.replace('w=1200', 'w=480')} 480w,
  ${item.url.replace('w=1200', 'w=768')} 768w,
  ${item.url.replace('w=1200', 'w=1024')} 1024w
`;

slideImage.sizes = `(max-width: 600px) 100vw, (max-width: 1024px) 90vw, 60vw`;
slideImage.alt = item.title;
;
  // Concatenate title and description on the same line.
  slideTitle.textContent = item.title + ' - ' + item.description;
}

// Navigation functions.
function nextSlide() {
  showSlide(currentSlideIndex + 1);
}

function prevSlide() {
  showSlide(currentSlideIndex - 1);
}

// Attach arrow button event listeners.
document.getElementById('nextSlide').addEventListener('click', nextSlide);
document.getElementById('prevSlide').addEventListener('click', prevSlide);

// Optional: enable keyboard navigation.
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    prevSlide();
  }
});

// Fetch the gallery data from your Contentful proxy.
// Replace 'YOUR_GALLERY_ENTRY_ID' with the actual entry ID holding your gallery content.
// It's assumed each image object includes properties: title, url, and description.
const galleryEntryId = '1Y1HXZR5YdGX3W8xCa8o5C';
const locale = window.location.pathname.startsWith('/el/') ? 'el' : 'en-US';

fetch(`/.netlify/functions/contentful-proxy?entryId=${galleryEntryId}&locale=${locale}`)
  .then(response => response.json())
  .then(data => {
    console.log('Resolved Gallery Data:', data);
    // Ensure the returned data contains an images array.
    if (data && data.images && Array.isArray(data.images)) {
      // Map each image object to include title, url, and description.
    galleryItems = data.images.map(img => ({
  title: img.title,
  url: `${img.url}?fm=webp&fit=pad&w=1200&bg=rgb:ffffff&q=80`,
 // 👈 Smart optimization
  description: img.description
}));

      // Initialize the slideshow by showing the first image.
      showSlide(0);
    } else {
      console.warn("No gallery items found");
    }
  })
  .catch(error => console.error("Error fetching gallery data:", error));

// POPUP SCRIPT
document.addEventListener('DOMContentLoaded', () => {
  const overlay   = document.getElementById('popupOverlay');
  const popup     = document.getElementById('exhibitionPopup');
  const closeBtn  = document.getElementById('closePopup');
  const video     = document.getElementById('popupVideo');
  const playBtn   = document.getElementById('videoPlayPause');
  const muteBtn   = document.getElementById('videoMuteUnmute');

  // 1) when to show: here we delay 1s after load
  setTimeout(() => {
    overlay.style.display = 'block';
    popup.style.display   = 'block';

    // lazy-load the video src only when pop-up opens
    video.src = '/videos/exhibition.mp4';
    video.load();
  }, 1000);

  // 2) close handler
  closeBtn.addEventListener('click', () => {
    video.pause();
    popup.style.display   = 'none';
    overlay.style.display = 'none';
  });

  // 3) optional custom controls
  playBtn.addEventListener('click', function() {
    if (video.paused) {
      video.play();
      this.textContent = 'Pause';
    } else {
      video.pause();
      this.textContent = 'Play';
    }
  });

  muteBtn.addEventListener('click', function() {
    video.muted = !video.muted;
    this.textContent = video.muted ? 'Unmute' : 'Mute';
  });
});
