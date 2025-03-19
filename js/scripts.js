let slideIndex = 0;
let slides = null;

document.addEventListener('DOMContentLoaded', () => {
  // Grab all carousel slides
  slides = document.querySelectorAll('.carousel-slide');
  // Only call showSlide if there are slides present
  if (slides.length > 0) {
    showSlide(slideIndex);
  }
  
  // Hamburger menu toggle code
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  
  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }
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
