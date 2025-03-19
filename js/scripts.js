let slideIndex = 0;
let slides = null;

document.addEventListener('DOMContentLoaded', () => {
  // Grab all slides
  slides = document.querySelectorAll('.carousel-slide');
  // Show the first slide initially
  showSlide(slideIndex);
});
 const hasSubmenus = document.querySelectorAll('.has-submenu');
  hasSubmenus.forEach(link => {
    link.addEventListener('click', (event) => {
      // prevent default if it’s an <a> with no real link
      event.preventDefault();
      // find the submenu (the next sibling <ul class="submenu">)
      const submenu = link.nextElementSibling;
      if (submenu) {
        // toggle display
        if (submenu.style.display === 'block') {
          submenu.style.display = 'none';
        } else {
          submenu.style.display = 'block';
        }
      }
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
document.addEventListener('DOMContentLoaded', () => {
  // existing carousel code, etc.
  slides = document.querySelectorAll('.carousel-slide');
  showSlide(slideIndex);

  // Mobile nav toggle
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  hamburgerBtn.addEventListener('click', () => {
    // Toggle the "open" class on the mobileNav
    mobileNav.classList.toggle('open');
  });
});

function prevSlide() {
  slideIndex--;
  showSlide(slideIndex);
}
