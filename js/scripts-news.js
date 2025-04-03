import { documentToHtmlString } from "https://cdn.skypack.dev/@contentful/rich-text-html-renderer";

// 1) Submenu & Mobile Nav logic (same as your existing pages)
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

// 2) Fetch all news articles
fetch('/.netlify/functions/contentful-news-proxy') 
  .then(resp => resp.json())
  .then(articles => {
    console.log("Fetched articles:", articles);
    if (!Array.isArray(articles) || articles.length === 0) {
      console.warn("No articles found");
      return;
    }
    renderNewsList(articles);
    // Initialize Fitty on all text containers after rendering
    fitty('.news-box-text', {
      minSize: 12,
      maxSize: 36,
      multiLine: true
    });
  })
  .catch(err => console.error("Error fetching news:", err));

// 3) Build the list of “boxes”
function renderNewsList(articles) {
  const container = document.getElementById('newsContainer');
  if (!container) {
    console.warn("No #newsContainer found in the DOM");
    return;
  }
  container.innerHTML = '';

  articles.forEach(article => {
    // Create the wrapper “box” div
    const boxDiv = document.createElement('div');
    boxDiv.className = 'news-box collapsed'; // start in collapsed mode

    // Build the collapsed layout
    // Left side: thumbnail (20% width)
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'news-thumbnail';
    const img = document.createElement('img');
    img.src = article.thumbnailUrl;
    thumbnailDiv.appendChild(img);

    // Right side: text excerpt (wrap text in its own container for Fitty)
    const textDiv = document.createElement('div');
    textDiv.className = 'news-box-text';
    const titleEl = document.createElement('h3');
    titleEl.textContent = article.title;
    const excerptEl = document.createElement('p');
    // Use innerHTML so any HTML from shortExcerpt is rendered
    excerptEl.innerHTML = article.shortExcerpt;
    textDiv.appendChild(titleEl);
    textDiv.appendChild(excerptEl);

    // “Read More” button
    const readMoreBtn = document.createElement('button');
    readMoreBtn.textContent = 'Read More';
    textDiv.appendChild(readMoreBtn);

    // Add the two sides to the box
    boxDiv.appendChild(thumbnailDiv);
    boxDiv.appendChild(textDiv);

    // Build the expanded layout (hidden by default)
    const expandedDiv = document.createElement('div');
    expandedDiv.className = 'news-expanded';
    const bigImg = document.createElement('img');
    bigImg.src = article.thumbnailUrl; // same image, but in expanded view
    const bigTitle = document.createElement('h2');
    bigTitle.textContent = article.title;
    let fullBodyHTML = '';
    if (typeof article.body === 'object') {
      fullBodyHTML = documentToHtmlString(article.body);
    } else {
      fullBodyHTML = `<p>${article.body}</p>`;
    }
    const bodyContainer = document.createElement('div');
    bodyContainer.innerHTML = fullBodyHTML;

    // “Less” button
    const lessBtn = document.createElement('button');
    lessBtn.textContent = 'Less';

    // Append expanded elements to expandedDiv
    expandedDiv.appendChild(bigImg);
    expandedDiv.appendChild(bigTitle);
    expandedDiv.appendChild(bodyContainer);
    expandedDiv.appendChild(lessBtn);
    expandedDiv.style.display = 'none'; // hide initially
    boxDiv.appendChild(expandedDiv);

    // Hook up readMoreBtn and lessBtn actions
    readMoreBtn.addEventListener('click', () => {
      boxDiv.classList.remove('collapsed');
      thumbnailDiv.style.display = 'none';
      textDiv.style.display = 'none';
      expandedDiv.style.display = 'block';
    });

    lessBtn.addEventListener('click', () => {
      boxDiv.classList.add('collapsed');
      thumbnailDiv.style.display = 'block';
      textDiv.style.display = 'block';
      expandedDiv.style.display = 'none';
    });

    // Append the news box to the container
    container.appendChild(boxDiv);
  });
}
