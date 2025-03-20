
// Define global variables
let slideIndex = 0;
let slides = null;

// Function to show a slide
function showSlide(index) {
  if (!slides || slides.length === 0) return; // Prevent errors if slides are not found

  // Ensure index is always within range
  if (index < 0) {
    slideIndex = slides.length - 1; // Wrap to last slide
  } else if (index >= slides.length) {
    slideIndex = 0; // Wrap to first slide
  } else {
    slideIndex = index; // Set index normally
  }

  console.log("Showing Slide:", slideIndex); // Debugging test

  // Hide all slides
  slides.forEach((slide) => {
    slide.classList.remove("active-slide");
    slide.style.display = "none";
  });

  // Show the correct slide
  slides[slideIndex].style.display = "block";
  slides[slideIndex].classList.add("active-slide");
}

// Next slide function
function nextSlide() {
  showSlide(slideIndex + 1);
}

// Previous slide function
function prevSlide() {
  showSlide(slideIndex - 1);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript Loaded ✅");

  // Get all slides
  slides = document.querySelectorAll(".carousel-slide");

  if (slides.length > 0) {
    console.log("Slides Found:", slides.length);
    
    // ✅ Show first slide only if it's not already displayed
    slides.forEach((slide) => (slide.style.display = "none")); // Hide all slides
    slides[slideIndex].style.display = "block"; // Show only the first one
    slides[slideIndex].classList.add("active-slide");
   } else {
    console.warn("No slides found. Skipping slideshow setup.");
  }
 const submenuLinks = document.querySelectorAll(".has-submenu");

  submenuLinks.forEach(link => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // ✅ Prevents page reload
      
      const submenu = link.nextElementSibling; // ✅ Get the submenu `<ul>`

       document.querySelectorAll(".submenu").forEach(otherSubmenu => {
        if (otherSubmenu !== submenu) {
          otherSubmenu.classList.remove("open-submenu");
        }
      });

      // ✅ Toggle the clicked submenu
      submenu.classList.toggle("open-submenu");

      console.log("Submenu Toggled:", submenu); // Debugging log
    });
  });
  // Mobile Menu Toggle
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
});
