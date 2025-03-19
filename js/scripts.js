let slideIndex = 0;
let slides = null;

document.addEventListener('DOMContentLoaded', () => {
  // Grab all slides
  slides = document.querySelectorAll('.carousel-slide');
  // Show the first slide initially
  showSlide(slideIndex);
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