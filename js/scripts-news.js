import { documentToHtmlString } from "https://cdn.skypack.dev/@contentful/rich-text-html-renderer";

// --- Submenu & Mobile Nav logic ---
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
  });
});

const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileNav = document.getElementById("mobileNav");
if (hamburgerBtn && mobileNav) {
  hamburgerBtn.addEventListener("click", () => {
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

  // Determine if we're in mobile view (viewport 768px or narrower)
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

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

    // Right side: text excerpt wrapped for potential Fitty scaling
    const textDiv = document.createElement('div');
    textDiv.className = 'news-box-text';

    // Create a container for title and excerpt to keep them at the top
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';

    const titleEl = document.createElement('h4');
    titleEl.textContent = article.title;
    const excerptEl = document.createElement('p');
    excerptEl.innerHTML = article.shortExcerpt;

    textContainer.appendChild(titleEl);
    textContainer.appendChild(excerptEl);

    // "Read More" link for desktop view
    const readMoreLink = document.createElement('a');
    readMoreLink.href = "#";
    readMoreLink.className = 'read-more-link';
    readMoreLink.textContent = 'Read More';

    // Assemble the text section: first the text container, then the link
    textDiv.appendChild(textContainer);
    textDiv.appendChild(readMoreLink);

    // Assemble the collapsed box
    boxDiv.appendChild(thumbnailDiv);
    boxDiv.appendChild(textDiv);
    container.appendChild(boxDiv);

    if (isMobile) {
      // On mobile, hide the read-more link and make the entire box clickable
      readMoreLink.style.display = 'none';
      boxDiv.style.cursor = 'pointer';
      boxDiv.addEventListener('click', () => {
        renderNewsDetail(article, articles);
      });
    } else {
      // On desktop, attach click event only to the read-more link
      readMoreLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderNewsDetail(article, articles);
      });
    }
  });

  // Initialize Fitty on the text containers to scale text dynamically
  fitty('.news-box-text', {
    minSize: 6,
    maxSize: 20,
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

  // Define options to add target="_blank" and rel="noopener noreferrer"
  // for any hyperlinks rendered from Contentful rich text.
  const options = {
    renderNode: {
      'hyperlink': (node, next) => {
        const url = node.data.uri;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${next(node.content)}</a>`;
      }
    }
  };

  // Use the custom options if the article body is an object (rich text)
  if (typeof article.body === 'object') {
    fullBodyHTML = documentToHtmlString(article.body, options);
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

  // Attach event listener for the "Back" link to return to the list view
  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    renderNewsList(articles);
  });
}


const locale = window.location.pathname.startsWith('/el/') ? 'el' : 'en-US';

fetch(`/.netlify/functions/contentful-news-proxy?locale=${locale}`)
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
