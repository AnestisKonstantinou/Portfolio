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
let galleryItems = [];
let currentSlideIndex = 0;

// Function to show a slide based on its index
function showSlide(index) {
  if (galleryItems.length === 0) return;
  // Ensure index is within range (cyclic behavior)
  currentSlideIndex = (index + galleryItems.length) % galleryItems.length;
  const slideImage = document.getElementById('slide-image');
  const slideTitle = document.getElementById('slide-title');
  const item = galleryItems[currentSlideIndex];
  slideImage.src = item.url;
  slideImage.alt = item.title;
  slideTitle.textContent = item.title;
}

// Next and previous slide functions
function nextSlide() {
  showSlide(currentSlideIndex + 1);
}

function prevSlide() {
  showSlide(currentSlideIndex - 1);
}

// Attach event listeners to the arrow buttons
document.getElementById('nextSlide').addEventListener('click', nextSlide);
document.getElementById('prevSlide').addEventListener('click', prevSlide);

// (Optional) Also enable keyboard navigation for the slideshow
document.addEventListener('keydown', (e) => {
  // You can conditionally require that the slideshow is visible if needed.
  if (e.key === 'ArrowRight') {
    nextSlide();
  } else if (e.key === 'ArrowLeft') {
    prevSlide();
  }
});

// Replace 'YOUR_GALLERY_ENTRY_ID' with your actual entry ID that holds your gallery items.
const galleryEntryId = '1Y1HXZR5YdGX3W8xCa8o5C';
const locale = window.location.pathname.startsWith('/el/') ? 'el' : 'en-US';

fetch(`/.netlify/functions/contentful-proxy?entryId=${galleryEntryId}&locale=${locale}`)
  .then(response => response.json())
  .then(data => {
    console.log('Resolved Gallery Data:', data);
    // Assuming the returned object has an "images" array with each image having a title and url.
    if (data && data.images && Array.isArray(data.images)) {
      // Map the array to use only each item's title and url.
      galleryItems = data.images.map(img => ({
        title: img.title,  // Title for the individual gallery item.
        url: img.url       // URL for the image.
      }));
      // Initialize the slideshow with the first image.
      showSlide(0);
    } else {
      console.warn("No gallery items found");
    }
  })
  .catch(error => console.error("Error fetching gallery data:", error));

