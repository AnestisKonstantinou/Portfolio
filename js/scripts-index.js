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
  slideImage.src = item.url;
  slideImage.alt = item.title;
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
  url: `${img.url}?fm=webp&w=800&h=600&q=75`, // 👈 Smart optimization
  description: img.description
}));

      // Initialize the slideshow by showing the first image.
      showSlide(0);
    } else {
      console.warn("No gallery items found");
    }
  })
  .catch(error => console.error("Error fetching gallery data:", error));

