document.addEventListener("DOMContentLoaded", () => {
  // Existing submenu and mobile navigation code
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
  
  // Carousel variables and functions
  let slideIndex = 0;
  let slides = [];
  
  function showSlide(index) {
    if (slides.length === 0) return;
    // Wrap index if needed
    if (index < 0) {
      slideIndex = slides.length - 1;
    } else if (index >= slides.length) {
      slideIndex = 0;
    } else {
      slideIndex = index;
    }
    slides.forEach(slide => {
      slide.style.display = "none";
      slide.classList.remove("active-slide");
    });
    slides[slideIndex].style.display = "block";
    slides[slideIndex].classList.add("active-slide");
  }
  
  window.nextSlide = function() {
    showSlide(slideIndex + 1);
  }
  
  window.prevSlide = function() {
    showSlide(slideIndex - 1);
  }
  
  // Fetch gallery from Contentful

  const entryId = '4oU2dtZPY9gX61G3Q7iGK0'; // Your gallery entry ID
fetch(`/.netlify/functions/contentful-proxy?entryId=${galleryEntryId}`)
  .then(response => response.json())
  .then(data => {
      console.log('Contentful Gallery Data:', data);
      if (data.sys && data.sys.type === 'Entry' && data.fields) {
        const galleryEntry = data;
        const titleField = galleryEntry.fields.title || 'Untitled Gallery';
        const imagesArray = galleryEntry.fields.galleryItem || [];
  
        // Insert gallery title
        const galleryTitleEl = document.getElementById('galleryTitle');
        if (galleryTitleEl) {
          galleryTitleEl.textContent = titleField;
        }
  
        // Get gallery container and clear existing content
        const myGalleryDiv = document.getElementById('myGallery');
        if (!myGalleryDiv) {
          console.warn("No element with id 'myGallery' found in the DOM!");
          return;
        }
        
  
        if (imagesArray.length === 0) {
          console.warn("Empty gallery array in fields.galleryItem");
        } else {
          // Use a dedicated container for slides
          let slidesContainer = myGalleryDiv.querySelector('.carousel-slides');
          if (!slidesContainer) {
            slidesContainer = document.createElement('div');
            slidesContainer.className = 'carousel-slides';
            myGalleryDiv.appendChild(slidesContainer);
          }
          slidesContainer.innerHTML = ''; // Clear only the slides container
  
          // Helper: Create a carousel slide element given an asset object
          function createSlide(asset) {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'carousel-slide';
  
            // Create an image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'carousel-image-container';
  
            const imgEl = document.createElement('img');
            const imageUrl = 'https:' + asset.fields.file.url;
            imgEl.src = imageUrl;
            imgEl.alt = asset.fields.title || 'Gallery Image';
            imageContainer.appendChild(imgEl);
  
            // Create caption container (caption below the image)
            const captionDiv = document.createElement('div');
            captionDiv.className = 'carousel-caption';
  
            const titleEl = document.createElement('h3');
            titleEl.textContent = asset.fields.title || '';
            captionDiv.appendChild(titleEl);
  
            const descEl = document.createElement('p');
            // Log asset.fields to check that description is coming through:
            // console.log(asset.fields);
            descEl.textContent = asset.fields.description || '';
            captionDiv.appendChild(descEl);
  
            // Append the image container and then the caption to the slide
            slideDiv.appendChild(imageContainer);
            slideDiv.appendChild(captionDiv);
  
            return slideDiv;
          }
  
          // Process assets: try using data.includes.Asset first…
          if (data.includes && data.includes.Asset) {
            imagesArray.forEach(imageRef => {
              const asset = data.includes.Asset.find(a => a.sys.id === imageRef.sys.id);
              if (asset && asset.fields && asset.fields.file) {
                const slide = createSlide(asset);
                slidesContainer.appendChild(slide);
              }
            });
          } else {
            // …otherwise, fetch each asset individually
            const assetPromises = imagesArray.map(imageRef => {
              const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/assets/${imageRef.sys.id}?access_token=${accessToken}`;
              return fetch(assetUrl).then(resp => resp.json());
            });
            Promise.all(assetPromises)
              .then(assets => {
                assets.forEach(asset => {
                  if (asset.fields && asset.fields.file) {
                    const slide = createSlide(asset);
                    slidesContainer.appendChild(slide);
                  }
                });
              })
              .catch(err => console.error("Error fetching individual assets:", err));
          }
        }
      } else {
        console.warn('No valid entry found in the fetched data.');
      }
  
      // After a short delay (to allow slides to be appended), initialize carousel slides.
      setTimeout(() => {
        slides = document.querySelectorAll('.carousel-slide');
        if (slides.length > 0) {
          showSlide(0);
        } else {
          console.warn("No slides found for carousel.");
        }
      }, 1000);
    })
    .catch(err => console.error('Error fetching gallery:', err));
});
