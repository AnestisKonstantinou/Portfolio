// scripts-news.js
import { documentToHtmlString } from "https://cdn.skypack.dev/@contentful/rich-text-html-renderer";

// 1) Submenu & Mobile Nav logic (same code as your existing pages)
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
  })
  .catch(err => console.error("Error fetching news:", err));

// 3) Build the list of “boxes”
function renderNewsList(articles) {
  const container = document.getElementById('newsContainer');
  if (!container) {
    console.warn("No #newsContainer found in the DOM");
    return;
  }

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

    // Right side: text excerpt
    const textDiv = document.createElement('div');
    textDiv.className = 'news-text';
    const titleEl = document.createElement('h3');
    titleEl.textContent = article.title;
    const excerptEl = document.createElement('p');
    excerptEl.innerHTML = article.shortExcerpt; // short excerpt
    textDiv.appendChild(titleEl);
    textDiv.appendChild(excerptEl);

    // “Read More” button
    const readMoreBtn = document.createElement('button');
    readMoreBtn.textContent = 'Read More';
    textDiv.appendChild(readMoreBtn);

    // Add the two sides to the box
    boxDiv.appendChild(thumbnailDiv);
    boxDiv.appendChild(textDiv);

    // 4) Build the expanded layout (hidden by default)
    // We'll put a new div with the full content. 
    // Or we can build it dynamically on expand—this is simpler to just do now and hide it.
    const expandedDiv = document.createElement('div');
    expandedDiv.className = 'news-expanded';
    const bigImg = document.createElement('img');
    bigImg.src = article.thumbnailUrl; // same image, but in top-left
    const bigTitle = document.createElement('h2');
    bigTitle.textContent = article.title;
    // Convert the body to HTML if it's rich text
    let fullBodyHTML = '';
    if (typeof article.body === 'object') {
      // If it's a rich text document
      fullBodyHTML = documentToHtmlString(article.body);
    } else {
      // if plain text
      fullBodyHTML = `<p>${article.body}</p>`;
    }
    const bodyContainer = document.createElement('div');
    bodyContainer.innerHTML = fullBodyHTML;

    // “Less” button
    const lessBtn = document.createElement('button');
    lessBtn.textContent = 'Less';

    // Put them all in expandedDiv
    expandedDiv.appendChild(bigImg);
    expandedDiv.appendChild(bigTitle);
    expandedDiv.appendChild(bodyContainer);
    expandedDiv.appendChild(lessBtn);

    // Hide expandedDiv initially
    expandedDiv.style.display = 'none';
    boxDiv.appendChild(expandedDiv);

    // 5) Hook up readMoreBtn / lessBtn
    readMoreBtn.addEventListener('click', () => {
      // Hide the “collapsed” portion
      boxDiv.classList.remove('collapsed');
      thumbnailDiv.style.display = 'none';
      textDiv.style.display = 'none';

      // Show the expanded portion
      expandedDiv.style.display = 'block';
    });

    lessBtn.addEventListener('click', () => {
      // Show the collapsed portion again
      boxDiv.classList.add('collapsed');
      thumbnailDiv.style.display = 'block';
      textDiv.style.display = 'block';

      // Hide expanded
      expandedDiv.style.display = 'none';
    });

    // 6) Finally, append this box to the container
    container.appendChild(boxDiv);
  });
}
