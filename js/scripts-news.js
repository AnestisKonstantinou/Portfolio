import { documentToHtmlString } from "https://cdn.skypack.dev/@contentful/rich-text-html-renderer";

// --- Submenu & Mobile Nav logic (unchanged) ---
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

// --- Global variable to store fetched articles ---
let globalNewsArticles = [];

// --- Function to render the list view ---
function renderNewsList(articles) {
  const container = document.getElementById('newsContainer');
  if (!container) {
    console.warn("No #newsContainer found in the DOM");
    return;
  }
  container.innerHTML = ''; // Clear any existing content

  articles.forEach(article => {
    // Create a fixed-height news box (collapsed view)
    const boxDiv = document.createElement('div');
    boxDiv.className = 'news-box collapsed';

    // Left side: thumbnail (20% width)
    const thumbnailDiv = document.createElement('div');
    thumbnailDiv.className = 'news-thumbnail';
    const img = document.createElement('img');
    img.src = article.thumbnailUrl;
    thumbnailDiv.appendChild(img);

    // Right side: text excerpt
    const textDiv = document.createElement('div');
    textDiv.className = 'news-box-text';
    const titleEl = document.createElement('h3');
    titleEl.textContent = article.title;
    const excerptEl = document.createElement('p');
    excerptEl.innerHTML = article.shortExcerpt; // Render HTML from rich text
    textDiv.appendChild(titleEl);
    textDiv.appendChild(excerptEl);

    // "Read More" link styled as plain blue text (hyperlink)
    const readMoreLink = document.createElement('a');
    readMoreLink.href = "#";
    readMoreLink.className = 'read-more-link';
    readMoreLink.textContent = 'Read More';
    textDiv.appendChild(readMoreLink);

    // Assemble the collapsed box
    boxDiv.appendChild(thumbnailDiv);
    boxDiv.appendChild(textDiv);
    container.appendChild(boxDiv);

    // Attach event listener to the "Read More" link to show detail view
    readMoreLink.addEventListener('click', (e) => {
      e.preventDefault();
      renderNewsDetail(article, articles);
    });
  });

  // Initialize Fitty on the text containers to scale text dynamically
  fitty('.news-box-text', {
    minSize: 12,
    maxSize: 36,
    multiLine: true
  });
}

// --- Function to render the detail view for a single article ---
function renderNewsDetail(article, articles) {
  const container = document.getElementById('newsContainer');
  container.innerHTML = ''; // Clear list view

  // Create a container for the detail view that fills the newsContainer
  const detailDiv = document.createElement('div');
  detailDiv.className = 'news-detail';

  // Create a top row: image on left (20% width) and title on right
  const topRow = document.createElement('div');
  topRow.className = 'detail-top-row';

  const detailImg = document.createElement('img');
  detailImg.src = article.thumbnailUrl;
  detailImg.className = 'detail-thumbnail';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'detail-title';
  const detailTitle = document.createElement('h2');
  detailTitle.textContent = article.title;
  titleContainer.appendChild(detailTitle);

  topRow.appendChild(detailImg);
  topRow.appendChild(titleContainer);

  // Create a container for the full article body
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'detail-body';
  let fullBodyHTML = '';
  if (typeof article.body === 'object') {
    fullBodyHTML = documentToHtmlString(article.body);
  } else {
    fullBodyHTML = `<p>${article.body}</p>`;
  }
  bodyDiv.innerHTML = fullBodyHTML;

  // "Back" link as plain blue text (hyperlink)
  const backLink = document.createElement('a');
  backLink.href = "#";
  backLink.className = 'back-link';
  backLink.textContent = 'Back';

  // Assemble the detail view
  detailDiv.appendChild(topRow);
  detailDiv.appendChild(bodyDiv);
  detailDiv.appendChild(backLink);
  container.appendChild(detailDiv);

  // Attach event listener for "Back"
  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    renderNewsList(articles);
  });
}

// --- Fetch all news articles ---
fetch('/.netlify/functions/contentful-news-proxy')
  .then(resp => resp.json())
  .then(articles => {
    console.log("Fetched articles:", articles);
    if (!Array.isArray(articles) || articles.length === 0) {
      console.warn("No articles found");
      return;
    }
    globalNewsArticles = articles;
    renderNewsList(articles);
  })
  .catch(err => console.error("Error fetching news:", err));
