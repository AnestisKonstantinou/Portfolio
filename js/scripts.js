let slideIndex = 0;
let slides = null;

document.addEventListener('DOMContentLoaded', () => {
  // Existing code (carousel, hamburger menu toggle)
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
    console.log("JavaScript loaded, event listener attached!");
  }

  // Mobile submenu toggle logic
  const submenuLinks = document.querySelectorAll('.has-submenu');

  submenuLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    
    const submenu = link.nextElementSibling;
    
    // Close all other submenus before opening a new one
    document.querySelectorAll('.submenu').forEach(otherSubmenu => {
      if (otherSubmenu !== submenu) {
        otherSubmenu.classList.remove('open-submenu');
      }
    });

    // Toggle the clicked submenu
    submenu.classList.toggle('open-submenu');
  });
});
});
function showSlide(index) {
  // Hide all slides first
  slides.forEach(slide => {
    slide.classList.remove('active-slide');
  });

  // Wrap around if index is out of range
  if (index < 0) { 
    slideIndex = slides.length - 1;
  } else if (index >= slides.length) {
    slideIndex = 0;
  }

  // Show the new slide
  slides[slideIndex].classList.add('active-slide');
}

function nextSlide() {
  slideIndex++;
  showSlide(slideIndex);
}

function prevSlide() {
  slideIndex--;
  showSlide(slideIndex);
}
