const fetch = require('node-fetch');

/**
 * This function fetches *all* published "News Article" entries from Contentful,
 * and returns an array of simplified objects: [ {id, title, thumbnailUrl, excerpt, body}, ... ].
 * We do a fallback if includes.Asset is missing for the thumbnail.
 */
module.exports.handler = async (event, context) => {
  try {
    const spaceId = process.env.CONTENTFUL_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
    
    // Content type for your "News Article" (replace with your actual contentTypeId if needed)
    const contentTypeId = 'newsArticle'; 
    // If you named it differently, check your Contentful “Content Model” → “API Identifier”.

    const baseUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=${contentTypeId}&include=2`;
    const response = await fetch(baseUrl);
    const data = await response.json();

    if (!data || !data.items) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No items found or invalid response." }),
      };
    }

    // We want an array of simplified objects
    const resolvedArticles = [];

    // Build a map of assets for quick lookup from data.includes.Asset
    const assetMap = new Map();
    if (data.includes && data.includes.Asset) {
      data.includes.Asset.forEach(asset => {
        assetMap.set(asset.sys.id, asset);
      });
    }

    for (let i = 0; i < data.items.length; i++) {
      const entry = data.items[i];
      const fields = entry.fields || {};

      // Extract basics
      const title = fields.title || "Untitled News";
      const excerpt = fields.shortExcerpt || "";
      const body = fields.fullBody || "";
      const articleId = entry.sys.id; // unique ID for toggling

      // If the thumbnail is a direct asset link, we can find it in assetMap
      let thumbnailUrl = "";
      if (fields.thumbnailImage && fields.thumbnailImage.sys) {
        const assetId = fields.thumbnailImage.sys.id;
        const asset = assetMap.get(assetId);
        if (asset && asset.fields && asset.fields.file) {
          thumbnailUrl = "https:" + asset.fields.file.url;
        } else {
          // fallback fetch if needed, or leave as empty string
        }
      }

      // push the final object
      resolvedArticles.push({
        id: articleId,
        title,
        excerpt,
        body,
        thumbnailUrl
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resolvedArticles),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (err) {
    console.error("Error in contentful-news-proxy:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
